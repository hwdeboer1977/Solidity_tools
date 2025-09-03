const { expect } = require("chai");
const { ethers } = require("hardhat");

const DEC = 8;
const W = (s) => ethers.parseUnits(s, DEC);

describe("Vault smoke", function () {
  it("deploys and accepts a deposit", async () => {
    const [owner, user1, user2, walletA, walletB] = await ethers.getSigners();

    // Deploy mock wBTC
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    console.log("wBTC contract address: ", wbtc.target);

    // Deploy the vault
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await wbtc.getAddress(), owner.address);
    await vault.waitForDeployment();
    console.log("Vault's contract address: ", vault.target);

    // Test setting the max TVL of the vault
    const tx = await vault.setDepositCap(W("100"));
    // get (view)
    const cap = await vault.depositCap(); // BigInt
    console.log("New max TVL set (depositCap):", ethers.formatUnits(cap, 8)); // WBTC has 8 decimals

    // Set max deposit per user and min deposit
    await vault.setPerUserDepositCap(W("2"));
    await vault.setDepositMin(W("0.01"));

    // User 1 transfers 0.5 wBTC to vault
    const amountApprove = W("2");
    const amountUser1 = W("0.5");
    const amountUser2 = W("1");
    await wbtc.transfer(user1.address, amountApprove);
    await wbtc.connect(user1).approve(await vault.getAddress(), amountApprove);

    // Test vault's balance
    await expect(
      vault.connect(user1).deposit(amountUser1, user1.address)
    ).to.emit(vault, "Transfer"); // yWBTC mint

    expect(await vault.balanceOf(user1.address)).to.equal(amountUser1);
    expect(await vault.totalAssets()).to.equal(amountUser1);

    // User 2 transfers 1 wBTC to vault
    await wbtc.transfer(user2.address, amountApprove);
    await wbtc.connect(user2).approve(await vault.getAddress(), amountApprove);

    // Test vault's balance
    await expect(
      vault.connect(user2).deposit(amountUser2, user2.address)
    ).to.emit(vault, "Transfer"); // yWBTC mint

    expect(await vault.balanceOf(user2.address)).to.equal(amountUser2);
    expect(await vault.totalAssets()).to.equal(amountUser1 + amountUser2);

    // Rebalance config
    await vault.connect(owner).setRecipients(walletA.address, walletB.address);
    await vault.setSplitBPS(8500); // 85% / 15%
    await vault.setRebalanceMin(W("0.01")); // threshold

    const bps = await vault.splitA_BPS(); // BigInt (e.g., 8500n)
    console.log(
      "Split A/B:",
      Number(bps) / 100,
      "% /",
      100 - Number(bps) / 100,
      "%"
    );

    // Snapshot before
    const idleBefore = await wbtc.balanceOf(await vault.getAddress());
    const totalBefore = await vault.totalAssets();
    const navBefore = await vault.externalNav();
    expect(idleBefore).to.equal(W("1.5"));
    expect(navBefore).to.equal(0n);

    // --- Single rebalance call with event assertion ---
    const amountRebalance = W("1");
    const expectedToA = (amountRebalance * bps) / 10000n; // BigInt math
    const expectedToB = amountRebalance - expectedToA;

    await expect(vault.connect(owner).rebalance(amountRebalance))
      .to.emit(vault, "Rebalanced")
      .withArgs(amountRebalance, expectedToA, expectedToB);

    // Balances after
    const aBal = await wbtc.balanceOf(walletA.address);
    const bBal = await wbtc.balanceOf(walletB.address);
    const idleAfter = await wbtc.balanceOf(await vault.getAddress());
    const navAfter = await vault.externalNav();
    const totalAfter = await vault.totalAssets();

    // Assertions
    expect(aBal).to.equal(expectedToA);
    expect(bBal).to.equal(expectedToB);
    expect(idleAfter).to.equal(W("1.5") - amountRebalance); // idle down by 1
    expect(navAfter).to.equal(navBefore + amountRebalance); // externalNav up by 1
    expect(totalAfter).to.equal(totalBefore); // totalAssets unchanged

    console.log("A got:", ethers.formatUnits(aBal, DEC), "WBTC");
    console.log("B got:", ethers.formatUnits(bBal, DEC), "WBTC");
    console.log("idle after:", ethers.formatUnits(idleAfter, DEC), "WBTC");
    console.log("externalNav:", ethers.formatUnits(navAfter, DEC), "WBTC");
    console.log(
      "totalAssets unchanged:",
      ethers.formatUnits(totalBefore, DEC),
      "→",
      ethers.formatUnits(totalAfter, DEC),
      "WBTC"
    );
  });

  it("mints shares and respects depositMin via previewMint", async () => {
    const [owner, user] = await ethers.getSigners();
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await wbtc.getAddress(), owner.address);
    await vault.waitForDeployment();

    await vault.setDepositMin(ethers.parseUnits("0.01", 8));
    await wbtc.transfer(user.address, ethers.parseUnits("1", 8));
    await wbtc
      .connect(user)
      .approve(await vault.getAddress(), ethers.parseUnits("1", 8));

    // ok mint
    const shares = await vault.previewDeposit(ethers.parseUnits("0.5", 8));
    await vault.connect(user).mint(shares, user.address);

    // too small -> revert
    const tinyShares = await vault.previewDeposit(
      ethers.parseUnits("0.001", 8)
    );
    await expect(
      vault.connect(user).mint(tinyShares, user.address)
    ).to.be.revertedWith("deposit below minimum");
  });

  it("maxDeposit returns 0 when paused", async () => {
    const [owner, user] = await ethers.getSigners();
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await wbtc.getAddress(), owner.address);
    await vault.waitForDeployment();

    await vault.setDepositCap(ethers.parseUnits("100", 8));
    await vault.pause();
    expect(await vault.maxDeposit(user.address)).to.equal(0n);
    await vault.unpause();
  });

  it("onlyOwner setters & split bounds", async () => {
    const [owner, user] = await ethers.getSigners();
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await wbtc.getAddress(), owner.address);
    await vault.waitForDeployment();

    await expect(
      vault.connect(user).setDepositCap(1)
    ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    await expect(vault.setSplitBPS(10001)).to.be.revertedWith("split > 100%");
  });

  it("rebalance failure modes", async () => {
    const [owner, user, A, B] = await ethers.getSigners();
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await wbtc.getAddress(), owner.address);
    await vault.waitForDeployment();

    await wbtc.transfer(user.address, ethers.parseUnits("1", 8));
    await wbtc
      .connect(user)
      .approve(await vault.getAddress(), ethers.parseUnits("1", 8));
    await vault.connect(user).deposit(ethers.parseUnits("1", 8), user.address);

    await vault.setRebalanceMin(ethers.parseUnits("0.5", 8));
    // recipients not set -> revert
    await expect(
      vault.rebalance(ethers.parseUnits("0.5", 8))
    ).to.be.revertedWith("recipients not set");

    await vault.setRecipients(A.address, B.address);
    // below threshold
    await expect(
      vault.rebalance(ethers.parseUnits("0.4", 8))
    ).to.be.revertedWith("below threshold");
    // more than idle
    await expect(vault.rebalance(ethers.parseUnits("2", 8))).to.be.revertedWith(
      "insufficient idle"
    );
  });

  it("reportExternalNav handles gains and losses", async () => {
    const [owner, user, A, B] = await ethers.getSigners();
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await wbtc.getAddress(), owner.address);
    await vault.waitForDeployment();

    await wbtc.transfer(user.address, ethers.parseUnits("1", 8));
    await wbtc
      .connect(user)
      .approve(await vault.getAddress(), ethers.parseUnits("1", 8));
    await vault.connect(user).deposit(ethers.parseUnits("1", 8), user.address);

    await vault.setRecipients(A.address, B.address);
    await vault.setRebalanceMin(0);
    await vault.rebalance(ethers.parseUnits("0.6", 8)); // externalNav=0.6, idle=0.4, total=1.0

    await vault.reportExternalNav(ethers.parseUnits("0.8", 8)); // gain
    expect(await vault.totalAssets()).to.equal(ethers.parseUnits("1.2", 8));

    await vault.reportExternalNav(ethers.parseUnits("0.5", 8)); // loss
    expect(await vault.totalAssets()).to.equal(ethers.parseUnits("0.9", 8));
  });

  it("withdraw/redeem work; withdrawing > idle reverts", async () => {
    const [owner, user, A, B] = await ethers.getSigners();
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const wbtc = await MockWBTC.deploy();
    await wbtc.waitForDeployment();
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await wbtc.getAddress(), owner.address);
    await vault.waitForDeployment();

    await wbtc.transfer(user.address, ethers.parseUnits("1", 8));
    await wbtc
      .connect(user)
      .approve(await vault.getAddress(), ethers.parseUnits("1", 8));
    await vault.connect(user).deposit(ethers.parseUnits("1", 8), user.address);

    // set recipients and move most idle out so idle < 0.9
    await vault.setRecipients(A.address, B.address);
    await vault.setRebalanceMin(0);
    await vault.rebalance(ethers.parseUnits("0.8", 8)); // idle left ≈ 0.2

    // withdraw within idle
    await vault
      .connect(user)
      .withdraw(ethers.parseUnits("0.1", 8), user.address, user.address);

    // withdraw more than remaining idle -> ERC20 transfer fails -> revert
    await expect(
      vault
        .connect(user)
        .withdraw(ethers.parseUnits("0.3", 8), user.address, user.address)
    ).to.be.reverted;

    // redeem shares path still works for small amount
    // how much idle WBTC is actually in the vault?
    const idle = await wbtc.balanceOf(await vault.getAddress());

    // choose an assets amount <= idle (e.g., half of idle)
    const redeemAssets = idle / 2n;

    // convert that assets amount to shares, then redeem
    const redeemShares = await vault.convertToShares(redeemAssets);
    await vault.connect(user).redeem(redeemShares, user.address, user.address);
  });
});
