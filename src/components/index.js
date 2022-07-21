import { useCallback, useEffect, useState } from "react";
import web3ModalSetup from "./../helpers/web3ModalSetup";
import Web3 from "web3";
import getAbi from "../Abi";
import getAbiBusd from "./../Abi/busd";
import logo from "./../assets/logo.png";
import discord from "./../assets/discord-icon.svg"
import { CONTRACTADDR } from "../Abi";

/* eslint-disable no-unused-vars */
const web3Modal = web3ModalSetup();

const Interface = () => {
  const [Abi, setAbi] = useState();
  const [AbiBusd, setAbiBusd] = useState();
  const [web3, setWeb3] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [injectedProvider, setInjectedProvider] = useState();
  const [refetch, setRefetch] = useState(true);
  const [current, setCurrent] = useState(null);
  const [connButtonText, setConnButtonText] = useState("CONNECT");
  const [refLink, setRefLink] = useState(
    "https://zeustaking.finance/?ref=0x0000000000000000000000000000000000000000"
  );
  const [contractBalance, setContractBalance] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [userInvestment, setUserInvestment] = useState(0);
  const [userDailyRoi, setUserDailyRoi] = useState(0);
  const [roi, setRoi] = useState(5);
  const [dailyReward, setDailyReward] = useState(0);
  const [totalWithdraw, setTotalWithdraw] = useState(0);
  const [referralReward, setReferralReward] = useState(0);
  const [refTotalWithdraw, setRefTotalWithdraw] = useState(0);
  const [value, setValue] = useState('');
  const [balance, setBalance] = useState(0);
  const [pendingMessage, setPendingMessage] = useState('');
  const [allowance, setAllowance] = useState();
  const [calculate, setCalculator] = useState('');

  const queryParams = new URLSearchParams(window.location.search);
  let DefaultLink = queryParams.get("ref");
  if (DefaultLink === null) {
    DefaultLink = "0x9d1649bA477476FEBD989c2d6A8Da052c1cC2925";
  }

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (
      injectedProvider &&
      injectedProvider.provider &&
      typeof injectedProvider.provider.disconnect == "function"
    ) {
      await injectedProvider.provider.disconnect();
    }
    setIsConnected(false);

    window.location.reload();
  };
  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3(provider));
    const acc = provider.selectedAddress
      ? provider.selectedAddress
      : provider.accounts[0];

    const short = shortenAddr(acc);

    setWeb3(new Web3(provider));
    setAbi(await getAbi(new Web3(provider)));
    setAbiBusd(await getAbiBusd(new Web3(provider)));
    setCurrent(acc);
    setIsConnected(true);

    setConnButtonText(short);

    provider.on("chainChanged", (chainId) => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new Web3(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new Web3(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    setInterval(() => {
      setRefetch((prevRefetch) => {
        return !prevRefetch;
      });
    }, 10000);
  }, []);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
    // eslint-disable-next-line
  }, []);

  const shortenAddr = (addr) => {
    if (!addr) return "";
    const first = addr.substr(0, 3);
    const last = addr.substr(38, 41);
    return first + "..." + last;
  };

  useEffect(() => {
    const refData = async () => {
      if (isConnected && web3) {
        // now the referral link not showing
        const balance = await web3.eth.getBalance(current);

        const refLink = "https://zeustaking.finance/?ref=" + current;
        setRefLink(refLink);
        setBalance(web3.utils.fromWei(balance));
      }
    };

    refData();
  }, [isConnected, current, web3, refetch]);

  useEffect(() => {
    const AbiContract = async () => {
      if (!isConnected || !web3) return;
      const contractBalance = await Abi.methods.getBalance().call();
      setContractBalance(contractBalance / 10e17);
    };

    AbiContract();
  }, [isConnected, web3, Abi, refetch]);


  useEffect(() => {
    const Contract = async () => {

      if (isConnected && Abi) {

        let userBalance = await AbiBusd.methods.balanceOf(current).call();
        setUserBalance(userBalance);

        let userInvestment = await Abi.methods.investments(current).call();
        setUserInvestment(userInvestment.invested / 10e17);


        let dailyRoi = await Abi.methods.getDailyRoi(userInvestment.invested, current).call();
        setUserDailyRoi(dailyRoi / 10e17);

        let roiValue = await Abi.methods.getUserRoi(current).call();
        setRoi(roiValue / 10);

        let dailyReward = await Abi.methods.userReward(current).call();
        setDailyReward(dailyReward / 10e17);
        console.log(dailyReward)
      }
    };

    Contract();
    // eslint-disable-next-line
  }, [isConnected, refetch]);

  useEffect(() => {
    const Withdrawlconsole = async () => {
      if (isConnected && Abi) {

        let totalWithdraw = await Abi.methods.totalWithdraw(current).call();
        setTotalWithdraw(totalWithdraw.amount / 10e17);

      }
    }

    Withdrawlconsole();
    // eslint-disable-next-line
  }, [isConnected, refetch]);

  useEffect(() => {
    const ContractReward = async () => {
      if (isConnected && Abi) {

        let refEarnedWithdraw = await Abi.methods.referral(current).call();
        setReferralReward(refEarnedWithdraw.reward / 10e17);

        let refTotalWithdraw = await Abi.methods.refTotalWithdraw(current).call();
        setRefTotalWithdraw(refTotalWithdraw.totalWithdraw / 10e17);


      }
    };

    ContractReward();
    // eslint-disable-next-line
  }, [refetch]);

  useEffect(() => {
    const approvalallowance = async () => {
      if (isConnected && AbiBusd) {

        let _allowance = await AbiBusd.methods.allowance(current, CONTRACTADDR).call();
        setAllowance(_allowance);

      }
    };

    approvalallowance();

  }, [isConnected, refetch]);

  const withDraw = async (e) => {
    e.preventDefault();
    if (isConnected && Abi) {
      if (dailyReward > 0) {
        setPendingMessage("Withdrawing funds")
        await Abi.methods.withdrawal().send({
          from: current,
        });
        setPendingMessage("Successfully Withdraw");
      } else {
        console.log("Withdraw amount zero");
      }
    } else {
      console.log("connect wallet");
    }
  };

  const refWithdraw = async (e) => {
    e.preventDefault();
    if (isConnected && Abi) {
      if (referralReward > 0) {
        setPendingMessage("Rewards withdrawing")
        await Abi.methods.Ref_Withdraw().send({
          from: current,
        });
        setPendingMessage("Successfully Withdraw");
      } else {
        console.log("ReferralReward zero");
      }
    } else {
      console.log("connect wallet");
    }
  };

  const approval = async (e) => {
    e.preventDefault();
    if (isConnected && AbiBusd) {
      setPendingMessage("Approving Busd");
      let getAllowance = await AbiBusd.methods.allowance(current, CONTRACTADDR).call();
      console.log(getAllowance);
      let _amount = '100000000000000000000000000000000000';
      await AbiBusd.methods.approve(CONTRACTADDR, _amount).send({
        from: current,
      });
      setPendingMessage("Approved Successfully");
    }
    else {
      console.log("connect wallet");
    }
  };

  const closeBar = async (e) => {
    e.preventDefault();
    setPendingMessage('');
  }

  const deposit = async (e) => {
    e.preventDefault();
    if (isConnected && Abi) {
      if (value > 0) {
        if (value >= 10 && value <= 10000) {
          setPendingMessage("Deposit Pending...!")
          let _value = web3.utils.toWei(value);
          await Abi.methods.deposit(DefaultLink, _value).send({
            from: current,
          });
          setPendingMessage("Successfully Deposited")
        } else {
          console.log("Min investment is 10 BUSD & max amount of investment in 10k BUSD")
        }

      } else {
        console.log("Input value")
      }

    }
    else {
      console.log("connect wallet");
    }
  };

  const compound = async (e) => {
    e.preventDefault();

    if (isConnected && Abi) {

      if (dailyReward > 0) {
        setPendingMessage("Compound Pending...!")

        await Abi.methods.compound().send({
          from: current,
        });
        setPendingMessage("Successfully Compounded")
      } else {
        console.log("Input value");
      }
    }
    else {
      console.log("connect wallet");
    }
  }

  return (
    <>
      <nav className="navbar navbar-expand-sm navbar-dark" style={{ background: "black" }}>
        <div className="container-fluid">
          <a className="navbar-brand" href="https://zeustaking.finance"><img src={logo} alt="logo" className="img-fluid" style={{ width: "200px" }} /></a>
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link" href="https://whitepaper.zeustaking.finance/">WHITEPAPER</a>
            </li>
          </ul>
          <button className="btn btn-primary btn-lg btnd" style={{ background: "yellow", color: "black", border: "1px solid #fff" }} onClick={loadWeb3Modal}><i className="fas fa-wallet"></i> {connButtonText}</button>
        </div>
      </nav>
      <br />

      <div className="container">

        {pendingMessage !== '' ?
          <>
            <center>
              <div className="alert alert-warning alert-dismissible">
                <p onClick={closeBar} className="badge bg-dark" style={{ float: "right", cursor: "pointer" }}>X</p>
                {pendingMessage}
              </div>
            </center>
          </> :
          <></>
        }
        <div className="row">
          <div className="col-sm-3">
            <div className="card">
              <div className="card-body">
                <center>
                  <h3>Contract Balance</h3>
                  <h3> {Number(contractBalance).toFixed(2)} BUSD</h3>
                </center>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="card">
              <div className="card-body">
                <center>
                  <h3>Daily ROI</h3>
                  <h3>{roi}%</h3>
                </center>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="card">
              <div className="card-body">
                <center>
                  <h3>Withdrawal Fee</h3>
                  <h3>2%</h3>
                </center>
              </div>
            </div>
          </div>
          <div className="col-sm-3">
            <div className="card">
              <div className="card-body">
                <center>
                  <h3>Deposit Fee</h3>
                  <h4>6%</h4>
                </center>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br /> <div className="container">
        <div className="row">
          <div className="col-sm-4">
            <div className="card cardzeu">
              <div className="card-body">
                <h4><b>Investment Portal</b></h4>
                <hr />
                <table className="table">
                  <tbody>
                    <tr>
                      <td><h5><b>Wallet Balance</b></h5></td>
                      <td style={{ textAlign: "right" }}><h5>{Number(userBalance / 10e17).toFixed(2)} BUSD</h5></td>
                    </tr>
                    <tr>
                      <td><h5><b>User Invested</b></h5></td>
                      <td style={{ textAlign: "right" }}><h5>{Number(userInvestment).toFixed(2)} BUSD</h5></td>
                    </tr>
                    <tr>
                      <td><h5><b>Daily User ROI</b></h5></td>
                      <td style={{ textAlign: "right" }}><h5>{Number(userDailyRoi).toFixed(2)} BUSD</h5></td>
                    </tr>
                  </tbody>
                </table>
                <form onSubmit={deposit}>
                  <table className="table">
                    <tbody>
                      <tr><td>  <input
                        type="number"
                        placeholder="10 BUSD"
                        className="form-control"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                      />
                      </td>
                        <td style={{ textAlign: "right" }}>
                          {allowance > 0 ?
                            <>
                              <button className="btn btn-primary btn-lg" style={{ background: "black", color: "#fff", border: "1px solid #fff" }}>DEPOSIT</button>
                            </>
                            :
                            <>
                              <button className="btn btn-primary btn-lg" style={{ background: "black", color: "#fff", border: "1px solid #fff" }} onClick={approval}>APPROVE</button>
                            </>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </form>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card cardzeu">
              <div className="card-body">
                <h4><b>Statistics</b></h4>
                <hr />
                <table className="table">
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "center" }} colSpan="2">
                        <h6><b>Available Withdrawal</b> <br />{Number(dailyReward).toFixed(4)} BUSD</h6>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: "center" }} ><button className="btn btn-primary btn-lg" style={{ background: "black", color: "#fff", border: "1px solid #fff" }} onClick={withDraw}>Withdraw</button></td>
                      <td><button className="btn btn-primary btn-lg" style={{ background: "black", color: "#fff", border: "1px solid #fff" }} onClick={compound}>COMPOUND</button></td>
                    </tr>
                    <tr style={{ border: "none" }}>
                      <td><h5>Total Withdrawn</h5></td>
                      <td style={{ textAlign: "right" }}><h5>{Number(totalWithdraw).toFixed(2)} BUSD</h5></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="card">
              <div className="card-body" style={{ marginBottom: "27px" }}>
                <h4><b>Referral Link</b></h4>
                <hr />
                <form>
                  Share your Referral Link To Earn 12% of BUSD
                  <input type="text" value={refLink} className="form-control" />
                </form>
              </div>
            </div>
            <br />
            <div className="card">
              <div className="card-body">
                <h4><b>Referral Rewards  12%</b></h4>
                <hr />
                <table className="table">
                  <tbody>
                    <tr>
                      <td><h5>BUSD Rewards</h5></td>
                      <td style={{ textAlign: "right" }}><h5>{referralReward} BUSD</h5></td>
                    </tr>
                    <tr>
                      <td><h5>Total Withdrawn</h5></td>
                      <td style={{ textAlign: "right" }}><h5>{refTotalWithdraw} BUSD</h5></td>
                    </tr>
                  </tbody>
                </table>
                <center> <button className="btn btn-primary btn-lg" style={{ background: "black", color: "#fff", border: "1px solid #fff" }} onClick={refWithdraw}>Withdraw Rewards</button> </center>
              </div>
            </div>
          </div>
        </div>
        <br />
        <div className="row">
          <div className="col-sm-12">
            <div className="card">
              <div className="card-header">
                Investment Calculator
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-sm-6">
                    <h3>BUSD AMOUNT</h3>
                    <input
                      type="number"
                      placeholder="10"
                      className="form-control"
                      value={calculate}
                      onChange={(e) => setCalculator(e.target.value)}
                    />
                    <p>Amount of returns calculated on the basis of investment amount.
                      <br />
                      <b>Note:</b> Min investment is 10 BUSD & max amount of investment in 10k BUSD.</p>
                  </div>
                  <div className="col-sm-6" style={{ textAlign: "right" }}>
                    <h3>Return of Investment</h3>
                    <p>Daily Return: {Number(calculate / 100 * roi).toFixed(2)} BUSD <br /> Weekly Return: {Number(calculate / 100 * roi * 7).toFixed(2)} BUSD  <br /> Monthly Return: {Number(calculate / 100 * roi * 30).toFixed(2)} BUSD </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <br />
        <center>
          <h5>
            <a href="https://twitter.com/ZEUSTAKING" style={{ color: "black", textDecoration: "none" }}><i className="fa fa-twitter"></i> Twitter </a> - &nbsp;
            <a href="https://t.me/ZEUSTAKING" style={{ color: "black", textDecoration: "none" }}><i className="fa fa-telegram"></i> Telegram </a> - &nbsp;
            <a href="https://discord.gg/gqwudPDpkw" style={{ color: "black", textDecoration: "none" }}><img src={discord} width="22px" /> Discord </a> - &nbsp;
            <a href="https://bscscan.com/address/0x6137291056de7d362711c6e4A7810823e5c79431#code" style={{ color: "black", textDecoration: "none" }}><i className="fa fa-line-chart"></i> Bscscan </a>
          </h5>
        </center>
        <br />
      </div>
    </>
  );
}

export default Interface;
