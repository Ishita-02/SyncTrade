import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";

import copyXAbi from "../artifacts/contracts/Core.sol/Core.json";

describe("CopyXCore — Full Test Suite (Viem + Hardhat)", () => {
  let testClient: any;
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
  let copy: any;

  const USD = (n: number) => BigInt(n) * 10n ** 18n;

  beforeEach(async () => {
    testClient = await hre.viem.getTestClient();
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

    // Deploy MockERC20
    const ERC20 = await hre.viem.deployContract("MockERC20", [
      "MockUSDC",
      "mUSDC",
      18,
    ]);
    collateral = ERC20;

    // Mint tokens
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

    // MockOracle
    oracle = await hre.viem.deployContract("MockOracle", [USD(3000)]);

    // CopyXCore
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

    expect(leaderStored[0]).to.equal(
      getAddress(leader)
    );
    expect(leaderStored[2]).to.equal(true);
    expect(leaderStored[3]).to.equal("Scalping strat");
  });

  it("allows followers to subscribe & updates deposits properly", async () => {
    // Register leader
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    // follower1 approve
    await f1Client.writeContract({
      address: collateral.address,
      abi: collateral.abi,
      functionName: "approve",
      args: [copy.address, USD(200)],
    });

    // subscribe
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
    // register leader
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    // approve + subscribe follower1 = 100
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

    // approve + subscribe follower2 = 200
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

    // Leader opens 900 USD long position
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "leaderOpenLong",
      args: [0, USD(900), "0x0000000000000000000000000000000000000000"],
    });

    // follower1 = 100/300 => 33% => 300 USD
    // follower2 = 200/300 => 66% => 600 USD

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

    expect(fp1.sizeUsd).to.equal(USD(300));
    expect(fp2.sizeUsd).to.equal(USD(600));
    expect(fp1.isOpen).to.equal(true);
  });

  it("leader close closes all follower positions", async () => {
    await leaderClient.writeContract({
      address: copy.address,
      abi: copyXAbi.abi,
      functionName: "registerLeader",
      args: ["Meta", 0],
    });

    // approve + subscribe
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
      args: [0, USD(300), "0x0000000000000000000000000000000000000000"],
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

    // subscribe
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
