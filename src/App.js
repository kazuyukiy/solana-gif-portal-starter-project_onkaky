import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

import idl from './idl.json';

// 定数を宣言します。
const TWITTER_HANDLE = 'あなたのTwitterハンドル';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
    'https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif',
    'https://media.giphy.com/media/bC9czlgCMtw4cj8RgH/giphy.gif',
    'https://media.giphy.com/media/kC8N6DPOkbqWTxkNTe/giphy.gif',
    'https://media.giphy.com/media/26n6Gx9moCgs1pUuk/giphy.gif'
]

const App = () => {

    const [walletAddress, setWalletAddress] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [gifList, setGifList] = useState([]);

    // Check if Phantom Wallet is connected
    const checkIfWalletIsConnected = async () => {
	try {

	    // console.log('checkIfWalletIsConnected called');
	    
	    const { solana } = window;

	    // if (solana && solana.inPhantom){
	    if (solana){

		console.log('solana');
		
		if (solana.isPhantom){
		    console.log('Phantom wallet found!');

		    const response = await solana.connect({ onlyIfTrusted: true});
		    console.log(
			'Connected with Public Key:',
			response.publicKey.toString()
		    );

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

    const sendGif = async () => {
	if (inputValue.length > 0) {
	    console.log('Gif link:', inputValue);
	    setGifList([...gifList, inputValue]);
	    setInputValue('');
	} else {
	    console.log('Emply input. Try again.');
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

    const renderConnectedContainer = () => (
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
		{gifList.map(gif => (
		    <div className="gif-item" key={gif}>
			<img src={gif} alt={gif} />
		    </div>
		))}
	    </div>
	</div>
    );

    // Be done only on the first rendering
    // if the secotn parameter is [] (empty) useEffect hook will be called only once
    useEffect(() => {
	const onLoad = async () => {
	    await checkIfWalletIsConnected();
	};
	window.addEventListener('load', onLoad);
	return () => window.removeEventListener('load', onLoad);
    }, []);

    useEffect(() => {
	if (walletAddress) {
	    console.log('Fetching GIF list...');

	    setGifList(TEST_GIFS);
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
