import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from './keypair.json';

// require('dotenv').config({ debug: true });
require('dotenv').config();

// reference to Solana runtime
// SystemProgram: reference to Solana core program
// const { SystemProgram, Keypair } = web3;
const { SystemProgram } = web3;

// keypair to hold gif data
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
let baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address);

// use Devnet
// const network = clusterApiUrl('devnet');
// console.log("SOLANA_NETWORK:",process.env.REACT_APP_SOLANA_NETWORK);
const network = clusterApiUrl(process.env.REACT_APP_SOLANA_NETWORK);

// option when recieve confirmations of transactions
const opts = { preflightCommitment: "processed" }

// 定数を宣言します。
const TWITTER_HANDLE = 'あなたのTwitterハンドル';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// const TEST_GIFS = [
//     'https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif',
//     'https://media.giphy.com/media/bC9czlgCMtw4cj8RgH/giphy.gif',
//     'https://media.giphy.com/media/kC8N6DPOkbqWTxkNTe/giphy.gif',
//     'https://media.giphy.com/media/26n6Gx9moCgs1pUuk/giphy.gif'
// ]

const App = () => {

    const [walletAddress, setWalletAddress] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [gifList, setGifList] = useState([]);

    // Check if Phantom Wallet is connected
    const checkIfWalletIsConnected = async () => {
	try {
	    const { solana } = window;

	    if (solana){

		console.log('solana');
		
		if (solana.isPhantom){
		    console.log('Phantom wallet found!');

		    const response = await solana.connect({ onlyIfTrusted: true});
		    console.log(
			'Connected with Public Key:',
			response.publicKey.toString()
		    );
		    // Phantom wallet address
		    setWalletAddress(response.publicKey.toString());
		}
		
	    } else {
		alert('Solana object not found! Get a Phantom Wallet 👻');
	    }
	} catch (error) {
	    console.error(error);
	}
    };

    const connectWallet = async () => {
	const { solana } = window;

	if (solana) {
	    const response = await solana.connect();
	    console.log("Connected with Public Key:", response.publicKey.toString());
	    setWalletAddress(response.publicKey.toString());
	}
    };

    const onInputChange = (event) => {
	const { value } = event.target;
	setInputValue(value);
    };

    const getProvider = () => {
	const connection = new Connection(network, opts.preflightCommitment);
	const provider = new Provider(
	    connection, window.solana, opts.preflightCommitment,
	);
	return provider;
    }
    
    const createGifAccount = async () => {
	try {
	    const provider = getProvider();
	    const program = new Program(idl, programID, provider);
	    console.log("ping");

	    await program.rpc.startStuffOff({
		accounts: {
		    baseAccount: baseAccount.publicKey,
		    user: provider.wallet.publicKey,
		    systemProgram: SystemProgram.programId,
		    // Seems programId is correct
		    // Since it makes open wallet extension
		    // But with programID,
		    // it causes an eror without opening wallet extension
		    // systemProgram: SystemProgram.programID,
		},
		signers: [baseAccount]
	    });
	    console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
	    await getGifList();
	    
	} catch (error) {
	    console.log("Error creating BaseAccount account:", error)
	}
    }

    const sendGif = async () => {
	if (inputValue.length === 0) {
	    console.log("No gif link given!")
	    return
	}

	setInputValue('');
	console.log('Gif link:', inputValue);

	try {
	    const provider = getProvider();
	    const program = new Program(idl, programID, provider);

	    await program.rpc.addGif(inputValue, {
		accounts: {
		    baseAccount: baseAccount.publicKey,
		    user: provider.wallet.publicKey,
		},
	    });
	    console.log("Gif successfully send to program", inputValue)

	    await getGifList();
	} catch (error) {
	    console.log("Error sending GIF:", error)
	}
    };

    const renderNotConnectedContainer = () => (
	<button
	    className="cta-button connect-wallet-button"
	    onClick={connectWallet}
	>
	    Connect to Wallet
	    </button>
    );

    const renderConnectedContainer = () => {
	// program account not initialized
	if (gifList === null) {
	    return (
		<div className="connected-container">
		    <button type="submit" className="cta-button submit-gif-button" onClick={createGifAccount}>
			Do One-Time Initialization For GIF Program Account
		    </button>
		</div>
	    )
	}

	// program account valid so can submit GIF
	else {
	    return (
		<div className="connected-container">

		    <form
			onSubmit={(event) => {
			    event.preventDefault();
			    sendGif();
			}}
		    >
			<input
			    type="text"
			    placeholder="Enter gif link!"
			    value={inputValue}
			    onChange={onInputChange}
			/>
			<button type="submit" className="cta-button submit-gif-button">Submit</button>
		    </form>
		    <div className="gif-grid">
			{gifList.map((item, index) => (
			    <div className="gif-item" key={index}>
				<img src={item.gifLink} />
				</div>
			))}
		    </div>
		</div>
	    )
	}
    }
    
    // Be done only on the first rendering
    // if the secotn parameter is [] (empty) useEffect hook will be called only once
    useEffect(() => {
	const onLoad = async () => {
	    await checkIfWalletIsConnected();
	};
	window.addEventListener('load', onLoad);
	return () => window.removeEventListener('load', onLoad);
    }, []);

    const getGifList = async() => {
	try {
	    const provider = getProvider();
	    const program = new Program(idl, programID, provider);
	    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

	    console.log("Got the account", account)
	    setGifList(account.gifList)
	    
	} catch (error) {
	    console.log("Error in getGifList: ", error)
	    setGifList(null);
	}
    }

    useEffect(() => {
	if (walletAddress) {
	    console.log('Fetching GIF list...');
	    getGifList()
	}
    }, [walletAddress]);
    
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
            <p className="sub-text">View your GIF collection ✨</p>
	    {!walletAddress && renderNotConnectedContainer()}
        </div>
	  <main className="main">
	      {walletAddress && renderConnectedContainer()}
	  </main>
          <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
