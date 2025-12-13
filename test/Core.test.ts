import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

import copyXAbi from "../artifacts/contracts/Core.sol/Core.json";

// Constants
const ZERO_ETH_ADDR = "0x0000000000000000000000000000000000000000";
const USD = (n: number) => BigInt(n) * 10n ** 18n;

describe("CopyXCore — Full Test Suite (Viem + Hardhat)", () => {
  let publicClient: any;

  let ownerClient: any;
  let leaderClient: any;
  let f1Client: any;
  let f2Client: any;

  let owner: `0x${string}`;
  let leader: `0x${string}`;
  let follower1: `0x${string}`;
  let follower2: `0x${string}`;

  let collateral: any;
  let oracle: any;
  let mockFeed: any;
  let copy: any;

  beforeEach(async () => {
    publicClient = await hre.viem.getPublicClient();

    const wallets = await hre.viem.getWalletClients();

    ownerClient = wallets[0];
    leaderClient = wallets[1];
    f1Client = wallets[2];
    f2Client = wallets[3];

    owner = ownerClient.account.address;
    leader = leaderClient.account.address;
    follower1 = f1Client.account.address;
    follower2 = f2Client.account.address;

    const ERC20 = await hre.viem.deployContract("MockERC20", [
      "MockUSDC",
      "mUSDC",
      18,
    ]);

    collateral = ERC20;

    // Mint balances
    await ownerClient.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "mint",
      args: [follower1, USD(1000)],
    });

    await ownerClient.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "mint",
      args: [follower2, USD(1000)],
    });

    const MockFeed = await hre.viem.deployContract("MockChainlinkFeed", [
      3000n * 10n ** 8n, // Chainlink price with 8 decimals
    ]);

    mockFeed = MockFeed;

    oracle = await hre.viem.deployContract("ChainlinkOracle", []);

    await ownerClient.writeContract({
      address: oracle.address,
      abi: oracle.abi,
      functionName: "setFeed",
      args: [ZERO_ETH_ADDR, mockFeed.address],
    });

    copy = await hre.viem.deployContract("Core", [
      collateral.address,
      oracle.address,
    ]);
  });

 
  it("registers a leader with metadata", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Scalping strat", 0],
    });

    const leaderStored = await publicClient.readContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "leaders",
      args: [0],
    });

    expect(getAddress(leaderStored[0])).to.equal(getAddress(leader));
    expect(leaderStored[2]).to.equal(true);
    expect(leaderStored[3]).to.equal("Scalping strat");
  });

  it("allows followers to subscribe & updates deposits properly", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    await f1Client.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "approve",
      args: [copy.address, USD(200)],
    });

    await f1Client.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "subscribe",
      args: [0, USD(200)],
    });

    const dep = await publicClient.readContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "deposits",
      args: [0, follower1],
    });

    expect(dep).to.equal(USD(200));
  });

  it("mirrors leader openLong to followers proportionally", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    // follower1 puts 100
    await f1Client.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "approve",
      args: [copy.address, USD(100)],
    });

    await f1Client.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "subscribe",
      args: [0, USD(100)],
    });

    // follower2 puts 200
    await f2Client.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "approve",
      args: [copy.address, USD(200)],
    });

    await f2Client.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "subscribe",
      args: [0, USD(200)],
    });

    // leader opens 900 long
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "leaderOpenLong",
      args: [0, USD(900), ZERO_ETH_ADDR],
    });

    const fp1 = await publicClient.readContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "getFollowerPosition",
      args: [0, follower1],
    });

    const fp2 = await publicClient.readContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "getFollowerPosition",
      args: [0, follower2],
    });

    expect(fp1.sizeUsd).to.equal(USD(300)); // 100/300 * 900
    expect(fp2.sizeUsd).to.equal(USD(600)); // 200/300 * 900
    expect(fp1.isOpen).to.equal(true);
  });

  it("leader close closes all follower positions", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    // subscribe follower
    await f1Client.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "approve",
      args: [copy.address, USD(100)],
    });

    await f1Client.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "subscribe",
      args: [0, USD(100)],
    });

    // leader opens
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "leaderOpenLong",
      args: [0, USD(300), ZERO_ETH_ADDR],
    });

    // leader closes
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "leaderClose",
      args: [0],
    });

    const fp = await publicClient.readContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "getFollowerPosition",
      args: [0, follower1],
    });

    expect(fp.isOpen).to.equal(false);
  });

  it("follower can unsubscribe and get funds back", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    // approve
    await f1Client.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "approve",
      args: [copy.address, USD(50)],
    });

    await f1Client.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "subscribe",
      args: [0, USD(50)],
    });

    const before = await publicClient.readContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "balanceOf",
      args: [follower1],
    });

    // unsubscribe
    await f1Client.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "unsubscribe",
      args: [0],
    });

    const after = await publicClient.readContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "balanceOf",
      args: [follower1],
    });

    expect(Number(after)).to.be.greaterThan(Number(before));
  });
});

describe("CopyXCore — Revert & Edge Case Tests", () => {
  let publicClient: any;
  let ownerClient: any;
  let leaderClient: any;
  let f1Client: any;
  let f2Client: any;

  let owner: `0x${string}`;
  let leader: `0x${string}`;
  let follower1: `0x${string}`;
  let follower2: `0x${string}`;

  let collateral: any;
  let oracle: any;
  let mockFeed: any;
  let copy: any;

  const ZERO = 0n;
  const USD = (n: number) => BigInt(n) * 1_000_000_000_000_000_000n;
  const ZERO_ETH_ADDR = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    publicClient = await hre.viem.getPublicClient();

    const wallets = await hre.viem.getWalletClients();
    ownerClient = wallets[0];
    leaderClient = wallets[1];
    f1Client = wallets[2];
    f2Client = wallets[3];

    owner = ownerClient.account.address;
    leader = leaderClient.account.address;
    follower1 = f1Client.account.address;
    follower2 = f2Client.account.address;

    // Collateral
    collateral = await hre.viem.deployContract("MockERC20", [
      "MockUSDC",
      "mUSDC",
      18,
    ]);

    await ownerClient.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "mint",
      args: [follower1, USD(1000)],
    });

    // Mock Feed
    mockFeed = await hre.viem.deployContract("MockChainlinkFeed", [
      3000n * 10n ** 8n,
    ]);

    // Oracle
    oracle = await hre.viem.deployContract("ChainlinkOracle", []);

    await ownerClient.writeContract({
      address: oracle.address,
      abi: oracle.abi,
      functionName: "setFeed",
      args: [ZERO_ETH_ADDR, mockFeed.address],
    });

    // CopyXCore
    copy = await hre.viem.deployContract("Core", [
      collateral.address,
      oracle.address,
    ]);
  });

  
  it("reverts if non-leader tries to open a position", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    await expect(
      f1Client.writeContract({
        address: copy.address,
        abi: copyXAbi.abi,
        functionName: "leaderOpenLong",
        args: [0, USD(100), ZERO_ETH_ADDR],
      })
    ).to.be.rejectedWith("Not leader");
  });

  // -----------------------------------------------------
  // ❌ REVERT: cannot subscribe with 0 amount
  // -----------------------------------------------------
  it("reverts on zero subscription amount", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Strat", 0],
    });

    await expect(
      f1Client.writeContract({
        address: copy.address,
        abi: copyXAbi.abi,
        functionName: "subscribe",
        args: [0, 0n],
      })
    ).to.be.rejected;
  });

  // -----------------------------------------------------
  // ❌ REVERT: unsubscribing without subscribing
  // -----------------------------------------------------
  it("reverts when unsubscribing without subscription", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    await expect(
      f1Client.writeContract({
        address: copy.address,
        abi: copyXAbi.abi,
        functionName: "unsubscribe",
        args: [0],
      })
    ).to.be.rejected;
  });

  // -----------------------------------------------------
  // ❌ REVERT: leader cannot close if no open position
  // -----------------------------------------------------
  it("reverts if leader closes without open position", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    await expect(
      leaderClient.writeContract({
        address: copy.address,
        abi: copyXAbi.abi,
        functionName: "leaderClose",
        args: [0],
      })
    ).to.be.rejectedWith("leader no open pos");
  });

  // -----------------------------------------------------
  // ❌ REVERT: opening long twice
  // -----------------------------------------------------
  it("reverts when leader tries to open a second open position", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    // follower subscribes (required for mirroring)
    await f1Client.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "approve",
      args: [copy.address, USD(100)],
    });

    await f1Client.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "subscribe",
      args: [0, USD(100)],
    });

    // First open works
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "leaderOpenLong",
      args: [0, USD(100), ZERO_ETH_ADDR],
    });

    // Second open SHOULD REVERT
    await expect(
      leaderClient.writeContract({
        address: copy.address,
        abi: copyXAbi.abi,
        functionName: "leaderOpenLong",
        args: [0, USD(100), ZERO_ETH_ADDR],
      })
    ).to.be.rejected;
  });

  // -----------------------------------------------------
  // ❌ REVERT: price feed missing for a token
  // -----------------------------------------------------
  it("reverts if no Chainlink feed is set for token", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    await f1Client.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "approve",
      args: [copy.address, USD(50)],
    });

    await f1Client.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "subscribe",
      args: [0, USD(50)],
    });

    // Attempt to use token without a feed → revert
    await expect(
      leaderClient.writeContract({
        address: copy.address,
        abi: copyXAbi.abi,
        functionName: "leaderOpenLong",
        args: [
          0,
          USD(100),
          "0x0000000000000000000000000000000000009999",
        ],
      })
    ).to.be.rejected;
  });

  // -----------------------------------------------------
  // ❌ REVERT: follower cannot mirror if no deposit
  // -----------------------------------------------------
  it("does not create follower positions for unsubscribed users", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    // No subscribers
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "leaderOpenLong",
      args: [0, USD(500), ZERO_ETH_ADDR],
    });

    const fp = await publicClient.readContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "getFollowerPosition",
      args: [0, follower1],
    });

    expect(fp.sizeUsd).to.equal(0n);
    expect(fp.isOpen).to.equal(false);
  });

  // -----------------------------------------------------
  // ❌ REVERT: non-owner cannot set feed
  // -----------------------------------------------------
  it("reverts when non-owner tries to set price feed", async () => {
    await expect(
      f1Client.writeContract({
        address: oracle.address,
        abi: oracle.abi,
        functionName: "setFeed",
        args: [ZERO_ETH_ADDR, mockFeed.address],
      })
    ).to.be.rejected;
  });
});

