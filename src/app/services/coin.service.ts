import { Injectable } from '@angular/core';
import { MyCoin } from '../models/mycoin';
import * as BIP32 from 'node_modules/bip32';
import * as Btc from 'bitcoinjs-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
// import { hdkey } from 'ethereumjs-wallet/dist'; // v1.0.1 version, not working?
import * as hdkey from 'ethereumjs-wallet/hdkey';
import * as bchaddr from 'bchaddrjs';

import { Address } from '../models/address';
import { coin_list } from '../config/coins';
import { ApiService } from './api.service';
import * as wif from 'wif';
// import * as bitcore from 'bitcore-lib-cash';
// import * as BchMessage from 'bitcore-message';
import { Web3Service } from './web3.service';
import { Signature } from '../interfaces/kanban.interface';
import { UtilService } from './util.service';
import { environment } from '../../environments/environment';
import BigNumber from 'bignumber.js/bignumber';
import TronWeb from 'tronweb';


const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider(environment.chains.TRX.fullNode);
const solidityNode = new HttpProvider(environment.chains.TRX.solidityNode);
const eventServer = new HttpProvider(environment.chains.TRX.eventServer);
const ADDRESS_PREFIX_REGEX = /^(41)/;

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer
);

@Injectable()
export class CoinService {
    txids: any;
    constructor(private apiService: ApiService, private web3Serv: Web3Service, private utilServ: UtilService) {
        this.txids = [];
    }

    getCoinTypeIdByName(name: string) {
        name = name.toUpperCase();
        for (let i = 0; i < coin_list.length; i++) {
            const coin = coin_list[i];
            if (coin.name === name) {
                return coin.id;
            }
        }
        return -1;
    }

    getCoinNameByTypeId(id: number) {

        for (let i = 0; i < coin_list.length; i++) {
            const coin = coin_list[i];
            if (coin.id === id) {
                return coin.name;
            }
        }
        return '';
        /*
        return coin_list[id].name;
        */
    }

    async getEthGasprice() {
        const gasPrice = await this.apiService.getEthGasPrice();
        return new BigNumber(gasPrice).dividedBy(new BigNumber(1e9)).toNumber();
    }

    initToken(type: string, name: string, decimals: number, address: string, baseCoin: MyCoin) {
        const coin = new MyCoin(name);
        coin.tokenType = type;
        coin.decimals = decimals;
        coin.contractAddr = address;
        coin.coinType = baseCoin.coinType;
        coin.baseCoin = baseCoin;
        const addr = new Address(baseCoin.coinType, baseCoin.receiveAdds[0].address, 0);
        coin.receiveAdds.push(addr);
        return coin;
    }

    addTxids(txids) {
        this.txids = this.txids.concat(txids);
    }

    initMyCoins(seed: Buffer): MyCoin[] {
        console.log('begin initMyCoins');
        const myCoins = [];

        const fabCoin = new MyCoin('FAB');
        this.fillUpAddress(fabCoin, seed, 1, 0);

        const exgCoin = this.initToken('FAB', 'EXG', 18, environment.addresses.smartContract.EXG, fabCoin);
        this.fillUpAddress(exgCoin, seed, 1, 0);

        myCoins.push(exgCoin);
        myCoins.push(fabCoin);

        const btcCoin = new MyCoin('BTC');
        this.fillUpAddress(btcCoin, seed, 1, 0);
        myCoins.push(btcCoin);

        const ethCoin = new MyCoin('ETH');
        this.fillUpAddress(ethCoin, seed, 1, 0);
        myCoins.push(ethCoin);

        console.log('here1');

        const usdtCoin = this.initToken('ETH', 'USDT', 6, environment.addresses.smartContract.USDT, ethCoin);

        this.fillUpAddress(usdtCoin, seed, 1, 0);

        myCoins.push(usdtCoin);

        const dusdCoin = this.initToken('FAB', 'DUSD', 18, environment.addresses.smartContract.DUSD, fabCoin);

        this.fillUpAddress(dusdCoin, seed, 1, 0);

        myCoins.push(dusdCoin);

        const bchCoin = new MyCoin('BCH');

        this.fillUpAddress(bchCoin, seed, 1, 0);

        myCoins.push(bchCoin);

        const ltcCoin = new MyCoin('LTC');

        this.fillUpAddress(ltcCoin, seed, 1, 0);

        myCoins.push(ltcCoin);

        const dogCoin = new MyCoin('DOGE');
        this.fillUpAddress(dogCoin, seed, 1, 0);
        myCoins.push(dogCoin);

        const trxCoin = new MyCoin('TRX');
        this.fillUpAddress(trxCoin, seed, 1, 0);
        myCoins.push(trxCoin);

        const usdtTRXCoin = this.initToken('TRX', 'USDT', 6, environment.addresses.smartContract.USDT, trxCoin);

        this.fillUpAddress(usdtTRXCoin, seed, 1, 0);

        myCoins.push(usdtTRXCoin);

        const erc20Tokens = ['INB', 'REP', 'HOT', 'MATIC', 'IOST', 'MANA', 'ELF', 'GNO', 'WINGS', 'KNC', 'GVT', 'DRGN'];

        for (let i = 0; i < erc20Tokens.length; i++) {
            const token_Name = erc20Tokens[i];
            const tokener = this.initToken('ETH', token_Name, 18, environment.addresses.smartContract[token_Name], ethCoin);
            this.fillUpAddress(tokener, seed, 1, 0);
            myCoins.push(tokener);
        }

        const erc20Tokens2 = ['FUN', 'WAX', 'MTL'];

        for (let i = 0; i < erc20Tokens2.length; i++) {
            const token_Name = erc20Tokens2[i];
            const tokener = this.initToken('ETH', token_Name, 8, environment.addresses.smartContract[token_Name], ethCoin);
            this.fillUpAddress(tokener, seed, 1, 0);
            myCoins.push(tokener);
        }

        let tokenName = 'POWR';
        let token = this.initToken('ETH', tokenName, 6, environment.addresses.smartContract[tokenName], ethCoin);
        this.fillUpAddress(token, seed, 1, 0);
        myCoins.push(token);

        tokenName = 'CEL';
        token = this.initToken('ETH', tokenName, 4, environment.addresses.smartContract[tokenName], ethCoin);
        this.fillUpAddress(token, seed, 1, 0);
        myCoins.push(token);


        const cnbCoin = this.initToken('FAB', 'CNB', 18, environment.addresses.smartContract.CNB, fabCoin);
        this.fillUpAddress(cnbCoin, seed, 1, 0);
        myCoins.push(cnbCoin);

        return myCoins;
    }

    initBTCinFAB(seed: Buffer) {
        const coin = new MyCoin('BTC');
        coin.coinType = environment.CoinType.FAB;
        this.fillUpAddress(coin, seed, 1, 0);
        return coin;
    }

    initFABinBTC(seed: Buffer) {
        const coin = new MyCoin('FAB');
        coin.coinType = environment.CoinType.BTC;
        this.fillUpAddress(coin, seed, 1, 0);
        return coin;
    }

    initMyCoinsOld(seed: Buffer): MyCoin[] {
        const myCoins = new Array();

        const fabCoin = new MyCoin('FAB');
        fabCoin.coinType = 0;
        this.fillUpAddress(fabCoin, seed, 1, 0);

        const exgCoin = this.initToken('FAB', 'EXG', 18, environment.addresses.smartContract.EXG, fabCoin);
        exgCoin.coinType = 0;
        this.fillUpAddress(exgCoin, seed, 1, 0);

        myCoins.push(exgCoin);
        myCoins.push(fabCoin);

        const btcCoin = new MyCoin('BTC');
        btcCoin.coinType = 0;
        this.fillUpAddress(btcCoin, seed, 1, 0);
        myCoins.push(btcCoin);

        const ethCoin = new MyCoin('ETH');
        ethCoin.coinType = 0;
        this.fillUpAddress(ethCoin, seed, 1, 0);
        myCoins.push(ethCoin);

        /*
        coin = new MyCoin('USDT');
        this.fillUpAddress(coin, seed, 1, 0);
        myCoins.push(coin);  
        */
        const usdtCoin = this.initToken('ETH', 'USDT', 6, environment.addresses.smartContract.USDT, ethCoin);
        usdtCoin.coinType = 0;
        this.fillUpAddress(usdtCoin, seed, 1, 0);
        myCoins.push(usdtCoin);

        return myCoins;
    }

    initExCoin(seed: Buffer): MyCoin {
        const coin = new MyCoin('EX');
        this.fillUpAddress(coin, seed, 1, 0);
        return coin;
    }

    initExCoinOld(seed: Buffer): MyCoin {
        const coin = new MyCoin('EX');
        coin.coinType = 0;
        this.fillUpAddress(coin, seed, 1, 0);
        return coin;
    }

    getOfficialAddress(myCoin: MyCoin) {
        const coinName = myCoin.name;
        /*
        const addresses = environment.addresses.exchangilyOfficial;
        for (let i = 0; i < addresses.length; i++) {
            if (addresses[i].name === myCoin.name) {
                return addresses[i].address;
            }
        }
        */

        if (environment.addresses.exchangilyOfficial[coinName]) {
            return environment.addresses.exchangilyOfficial[coinName];
        }
        return '';
    }

    async depositFab(scarContractAddress: string, seed: any, mycoin: MyCoin, amount: number) {
        // sendTokens in https://github.com/ankitfa/Fab_sc_test1/blob/master/app/walletManager.js
        const gasLimit = 800000;
        const gasPrice = 40;

        // console.log('scarContractAddress=', scarContractAddress);
        const totalAmount = gasLimit * gasPrice / 1e8;
        // let cFee = 3000 / 1e8 // fee for the transaction

        let totalFee = totalAmount;

        // -----------------------------------------------------------------------
        const addDepositFunc: any = {
            'constant': false,
            'inputs': [],
            'name': 'addDeposit',
            'outputs': [
                {
                    'name': '',
                    'type': 'address'
                }
            ],
            'payable': true,
            'stateMutability': 'payable',
            'type': 'function'
        };

        let fxnCallHex = this.web3Serv.getGeneralFunctionABI(addDepositFunc, []);
        fxnCallHex = this.utilServ.stripHexPrefix(fxnCallHex);

        // console.log('fxnCallHexfxnCallHexfxnCallHexfxnCallHexfxnCallHex=', fxnCallHex);
        const contract = Btc.script.compile([
            84,
            this.utilServ.number2Buffer(gasLimit),
            this.utilServ.number2Buffer(gasPrice),
            this.utilServ.hex2Buffer(fxnCallHex),
            this.utilServ.hex2Buffer(scarContractAddress),
            194
        ]);

        // console.log('contract=', contract);
        const contractSize = contract.toJSON.toString().length;

        // console.log('contractSize=' + contractSize);
        totalFee += this.utilServ.convertLiuToFabcoin(contractSize * 10);

        // console.log('totalFee=' + totalFee);
        const res = await this.getFabTransactionHex(seed, mycoin, contract, amount, totalFee,
            environment.chains.FAB.satoshisPerBytes, environment.chains.FAB.bytesPerInput, false);

        const txHex = res.txHex;
        let errMsg = res.errMsg;
        let txHash = '';
        if (!errMsg) {
            const res2 = await this.apiService.postFabTx(txHex);
            txHash = res2.txHash;
            errMsg = res2.errMsg;
        }
        return { txHash: txHash, errMsg: errMsg };
    }

    async getBlanceByAddress(tokenType: string, contractAddr: string, name: string, addr: string, decimals: number) {
        let balance = 0;
        let lockbalance = 0;
        if (name === 'BTC') {
            const balanceObj = await this.apiService.getBtcBalance(addr);
            balance = balanceObj.balance / 1e8;
            lockbalance = balanceObj.lockbalance / 1e8;
        } else if (name === 'ETH') {
            const balanceObj = await this.apiService.getEthBalance(addr);
            balance = balanceObj.balance / 1e18;
            lockbalance = balanceObj.lockbalance / 1e18;
        } else if (name === 'BCH') {
            const balanceObj = await this.apiService.getBchBalance(addr);
            balance = balanceObj.balance / 1e18;
            lockbalance = balanceObj.lockbalance / 1e18;
        } else if (name === 'FAB') {
            const balanceObj = await this.apiService.getFabBalance(addr);
            balance = balanceObj.balance / 1e8;
            lockbalance = balanceObj.lockbalance / 1e8;
        } else if (tokenType === 'ETH') {
            if (!decimals) {
                decimals = 18;
            }
            const balanceObj = await this.apiService.getEthTokenBalance(name, contractAddr, addr);
            // console.log('balanceObj=', balanceObj);
            balance = balanceObj.balance / Math.pow(10, decimals);
            lockbalance = balanceObj.lockbalance / Math.pow(10, decimals);
        } else if (tokenType === 'FAB') {
            if(addr.indexOf('0x') < 0) {
                addr = this.utilServ.fabToExgAddress(addr);
            }
            let balanceObj;
            if (name === 'EXG') {
                balanceObj = await this.apiService.getExgBalance(addr);
            } else {
                balanceObj = await this.apiService.getFabTokenBalance(name, addr);
            }
            balance = balanceObj.balance / Math.pow(10, decimals);
            lockbalance = balanceObj.lockbalance / Math.pow(10, decimals);
        }
        return { balance, lockbalance };
    }

    walletBalance(data: any) {
        return this.apiService.getWalletBalance(data);
    }

    getTransactionHistoryEvents(data: any) {
        return this.apiService.getTransactionHistoryEvents(data);
    }

    async getBalance(myCoin: MyCoin) {
        //console.log('myCoin.name for getBalance=', myCoin);
        let balance;
        let totalBalance = 0;
        let totalLockBalance = 0;
        const coinName = myCoin.name;
        const tokenType = myCoin.tokenType;
        const contractAddr = myCoin.contractAddr;

        let receiveAddsLen = myCoin.receiveAdds.length;
        let changeAddsLen = myCoin.changeAdds.length;

        if (coinName === 'BTC') {
            receiveAddsLen = (receiveAddsLen > 3) ? 3 : receiveAddsLen;
            changeAddsLen = (changeAddsLen > 3) ? 3 : changeAddsLen;
        }
        if (coinName === 'FAB') {
            receiveAddsLen = (receiveAddsLen > 1) ? 1 : receiveAddsLen;
            changeAddsLen = (changeAddsLen > 1) ? 1 : changeAddsLen;
        }

        for (let i = 0; i < 1; i++) {
            if ((!myCoin.receiveAdds) || (myCoin.receiveAdds.length === 0)) {
                continue;
            }
            const addr = myCoin.receiveAdds[i].address;

            const decimals = myCoin.decimals;
            balance = await this.getBlanceByAddress(tokenType, contractAddr, coinName, addr, decimals);

            myCoin.receiveAdds[i].balance = balance.balance;
            totalBalance += balance.balance;
            myCoin.receiveAdds[i].lockedBalance = balance.lockbalance;
            totalLockBalance += balance.lockbalance;
        }

        for (let i = 0; i < 1; i++) {
            if ((!myCoin.changeAdds) || (myCoin.changeAdds.length === 0)) {
                continue;
            }
            const addr = myCoin.changeAdds[i].address;
            const decimals = myCoin.decimals;
            balance = await this.getBlanceByAddress(tokenType, contractAddr, coinName, addr, decimals);

            myCoin.changeAdds[i].balance = balance.balance;
            totalBalance += balance.balance;
            myCoin.receiveAdds[i].lockedBalance = balance.lockbalance;
            totalLockBalance += balance.lockbalance;
        }
        return { balance: totalBalance, lockbalance: totalLockBalance };
    }

    getKeyPairsFromPrivateKey(coin: MyCoin, privateKey: string) {
        const name = coin.name;

        let addr = '';
        const addrHash = '';
        let priKey;
        let pubKey = '';
        let priKeyHex = '';
        let priKeyDisp = '';
        let buffer = Buffer.alloc(32);        
        if (name === 'BTC' || name === 'FAB' || name === 'LTC' || name === 'DOGE' || name === 'BCH') {
            //privateKey = 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi';
            
            //const childNode = BIP32.fromBase58(privateKey, environment.chains[name]['network']);
            const alice = Btc.ECPair.fromWIF(privateKey, environment.chains[name]['network']);
            const { address } = Btc.payments.p2pkh({
                pubkey: alice.publicKey,
                network: environment.chains[name]['network']
            });
            
            console.log('address==', address);
            if (name === 'BCH') {
                console.log('address===', address);
                addr = bchaddr.toCashAddress(address);
            } else {
                addr = address;
            }

            priKey = privateKey;
            pubKey = `0x${alice.publicKey.toString('hex')}`;

            buffer = wif.decode(priKey);
            priKeyDisp = priKey;            
        }

        const keyPairs = {
            address: addr,
            addressHash: addrHash,
            privateKey: priKey,
            privateKeyHex: priKeyHex,
            privateKeyBuffer: buffer,
            privateKeyDisplay: priKeyDisp,
            publicKey: pubKey,
            name: name,
            tokenType: ''
        };

        return keyPairs;        
    }

    getKeyPairs(coin: MyCoin, seed: Buffer, chain: number, index: number) {
        const name = coin.name;

        const tokenType = coin.tokenType;
        let addr = '';
        const addrHash = '';
        let priKey;
        let pubKey = '';
        let priKeyHex = '';
        let priKeyDisp = '';
        let buffer = Buffer.alloc(32);

        if (!seed) {
            return {
                address: addr,
                addressHash: addrHash,
                privateKey: priKey,
                privateKeyHex: priKeyHex,
                privateKeyBuffer: buffer,
                privateKeyDisplay: priKeyDisp,
                publicKey: pubKey,
                name: name,
                tokenType: tokenType
            };
        }
        const path = 'm/44\'/' + coin.coinType + '\'/0\'/' + chain + '/' + index;

        if (name === 'BTC' || name === 'FAB' || name === 'LTC' || name === 'DOGE' || name === 'BCH') {
            const root = BIP32.fromSeed(seed, environment.chains[name]['network']);
            /*
            const childNode1 = root.deriveHardened(44);
            const childNode2 = childNode1.deriveHardened(coin.coinType);
            const childNode3 = childNode2.deriveHardened(0);
            const childNode4 = childNode3.derive(chain);
            const childNode = childNode4.derive(index);
            */
            const childNode = root.derivePath(path);
            const { address } = Btc.payments.p2pkh({
                pubkey: childNode.publicKey,
                network: environment.chains[name]['network']
            });

            console.log('pubkey: ' + childNode.publicKey.toString);
            if (name === 'BCH') {
                console.log('address===', address);
                addr = bchaddr.toCashAddress(address);
            } else {
                addr = address;
            }

            priKey = childNode.toWIF();
            pubKey = `0x${childNode.publicKey.toString('hex')}`;

            buffer = wif.decode(priKey);
            priKeyDisp = priKey;
        } else
        if (name === 'ETH' || tokenType === 'ETH') {

                const root = hdkey.fromMasterSeed(seed);
                const childNode = root.derivePath(path);

                const wallet = childNode.getWallet();
                const address = `0x${wallet.getAddress().toString('hex')}`;
                addr = address;
                buffer = wallet.getPrivateKey();
                priKey = wallet.getPrivateKey();
                priKeyDisp = buffer.toString('hex');
        } else
        if (name === 'TRX' || tokenType === 'TRX') {
                const root = BIP32.fromSeed(seed);
                const childNode = root.derivePath(path);
                
                //console.log('publicKey for TRX=', childNode.publicKey.toString('hex'));

                priKey = childNode.privateKey;

                buffer = wif.decode(childNode.toWIF());
                addr = 
                TronWeb.utils.crypto.getBase58CheckAddress(TronWeb.utils.crypto.getAddressFromPriKey(priKey));
        }
        else if (name === 'EX' || tokenType === 'FAB') {
                // console.log('000');
                const root = BIP32.fromSeed(seed, environment.chains.BTC.network);

                // console.log('root=', root);
                const childNode = root.derivePath(path);
                // console.log('childNode=', childNode);
                const originalPrivateKey = childNode.privateKey;
                // console.log('111');
                priKeyHex = originalPrivateKey.toString('hex');
                priKey = childNode.toWIF();
                // console.log('333');
                priKeyDisp = priKey;
                buffer = wif.decode(priKey);
                // console.log('buffer=', buffer);
                const publicKey = childNode.publicKey;
                // console.log('publicKey=', publicKey);
                // const publicKeyString = `0x${publicKey.toString('hex')}`;
                addr = this.utilServ.toKanbanAddress(publicKey);
        }

        const keyPairs = {
            address: addr,
            addressHash: addrHash,
            privateKey: priKey,
            privateKeyHex: priKeyHex,
            privateKeyBuffer: buffer,
            privateKeyDisplay: priKeyDisp,
            publicKey: pubKey,
            name: name,
            tokenType: tokenType
        };

        return keyPairs;
    }

    signedMessage(originalMessage: string, keyPair: any) {
        // originalMessage = '000254cbd93f69af7373dcf5fc01372230d309684f95053c7c9cbe95cf4e4e2da731000000000000000000000000000000000000000000000000000009184e72a000000000000000000000000000a2a3720c00c2872397e6d98f41305066cbf0f8b3';
        // console.log('originalMessage=', originalMessage);
        let signature: Signature;
        const name = keyPair.name;
        const tokenType = keyPair.tokenType;

        console.log('name==', name);
        console.log('tokenType==', tokenType);
        if (name === 'ETH' || tokenType === 'ETH') {
            signature = this.web3Serv.signMessageWithPrivateKey(originalMessage, keyPair) as Signature;
            // console.log('signature in signed is ');
            // console.log(signature);
        } else if (name === 'FAB' || name === 'BTC' || tokenType === 'FAB' || name === 'BCH' || name === 'DOGE' || name === 'LTC' || name === 'TRX' || tokenType == 'TRX') {
            // signature = this.web3Serv.signMessageWithPrivateKey(originalMessage, keyPair) as Signature;
            console.log('1aaa');
            let signBuffer: Buffer;
            console.log('keyPair.privateKeyBuffer.compressed===', keyPair.privateKeyBuffer.compressed);
            // if(name === 'FAB' || name === 'BTC' || tokenType === 'FAB' || name === 'LTC' || name === 'DOGE') {
            const chainName = tokenType ? tokenType : name;

            const messagePrefix = environment.chains[chainName].network.messagePrefix;

            console.log('messagePrefix=', messagePrefix);

            let v = '';
            let r = '';
            let s = '';
            console.log('2bbb');
            if(name === 'TRX' || tokenType == 'TRX') {
                const priKeyDisp = keyPair.privateKey.toString('hex'); 
                const signiture = TronWeb.Trx.signString(originalMessage, priKeyDisp);
                console.log('signiture=', signiture);
                r = '0x' + signiture.slice(2, 66);
                s = '0x' + signiture.slice(66, 130);
                v = '0x' + signiture.slice(130, 132);
                console.log('for trx');
                console.log(v,r,s);
            } else {
                signBuffer = bitcoinMessage.sign(originalMessage, keyPair.privateKeyBuffer.privateKey,
                    keyPair.privateKeyBuffer.compressed, messagePrefix);
                v = `0x${signBuffer.slice(0, 1).toString('hex')}`;
                r = `0x${signBuffer.slice(1, 33).toString('hex')}`;
                s = `0x${signBuffer.slice(33, 65).toString('hex')}`;  
            }


            signature = { r: r, s: s, v: v };

            console.log('signature====', signature);
        }
        return signature;
    }

    formCoinType(v: string, coinType: number) {
        let retString = v;
        retString = retString + this.utilServ.fixedLengh(coinType, 32 - v.length);
        return retString;
    }

    async getFabTransactionHex(seed: any, mycoin: MyCoin, to: any, amount: number, extraTransactionFee: number,
        satoshisPerBytes: number, bytesPerInput: number, getTransFeeOnly: boolean) {

        extraTransactionFee = Number(extraTransactionFee);
        amount = Number(amount);
        let index = 0;
        let finished = false;
        let address = '';
        let totalInput = 0;
        let transFee = 0;
        let amountInTx = new BigNumber(0);
        const txids = [];
        const feePerInput = bytesPerInput * satoshisPerBytes;
        const receiveAddsIndexArr = [];
        const changeAddsIndexArr = [];
        // console.log('amount111111111111=', amount);
        // console.log('extraTransactionFee=', extraTransactionFee);
        const totalAmount = Number(amount) + Number(extraTransactionFee);
        // console.log('totalAmount=', totalAmount);
        let amountNum = new BigNumber(this.utilServ.toBigNumber(totalAmount, 8)).toNumber();
        // console.log('amountNum=', amountNum);
        amountNum += (2 * 34) * satoshisPerBytes;
        // console.log('amountNum=', amountNum);
        // const TestNet = Btc.networks.testnet;
        const network = environment.chains.BTC.network;

        const txb = new Btc.TransactionBuilder(network);
        // console.log('amountNum=', amountNum);
        let txHex = '';

        for (index = 0; index < mycoin.receiveAdds.length; index++) {

            address = mycoin.receiveAdds[index].address;
            // console.log('address in getFabTransactionHex=' + address);
            const fabUtxos = await this.apiService.getFabUtxos(address);

            console.log('fabUtxos==', fabUtxos);
            if (fabUtxos && fabUtxos.length) {
                // console.log('fabUtxos=', fabUtxos);
                // console.log('fabUtxos.length=', fabUtxos.length);
                for (let i = 0; i < fabUtxos.length; i++) {
                    const utxo = fabUtxos[i];
                    const idx = utxo.idx;
                    /*
                    const isLocked = await this.apiService.isFabTransactionLocked(utxo.txid, idx);
                    if (isLocked) {
                        continue;
                    }
                    */

                    const txidItem = {
                        txid: utxo.txid,
                        idx: idx
                    };

                    let existed = false;
                    for (let iii = 0; iii < this.txids.length; iii++) {
                        const ttt = this.txids[iii];
                        if ((ttt.txid === txidItem.txid) && (ttt.idx === txidItem.idx)) {
                            console.log('continueeee');
                            existed = true;
                            break;
                        }
                    }

                    if (existed) {
                        continue;
                    }

                    txids.push(txidItem);

                    txb.addInput(utxo.txid, idx);
                    // console.log('input is');
                    // console.log(utxo.txid, utxo.idx, utxo.value);
                    receiveAddsIndexArr.push(index);
                    totalInput += utxo.value;
                    // console.log('totalInput here=', totalInput);
                    amountNum -= utxo.value;
                    amountNum += feePerInput;
                    if (((amount > 0) || (mycoin.tokenType === 'FAB')) && (amountNum <= 0)) {
                        console.log('finished');
                        finished = true;
                        break;
                    }
                }
            }
            if (finished) {
                break;
            }
        }

        // console.log('totalInput here 1=', totalInput);

        if (!finished) {
            for (index = 0; index < mycoin.changeAdds.length; index++) {

                address = mycoin.changeAdds[index].address;

                const fabUtxos = await this.apiService.getFabUtxos(address);

                if (fabUtxos && fabUtxos.length) {
                    for (let i = 0; i < fabUtxos.length; i++) {
                        const utxo = fabUtxos[i];
                        const idx = utxo.idx;

                        /*
                        const isLocked = await this.apiService.isFabTransactionLocked(utxo.txid, idx);
                        if (isLocked) {
                            continue;
                        }      
                        */

                        const txidItem = {
                            txid: utxo.txid,
                            idx: idx
                        };

                        let existed = false;
                        for (let iii = 0; iii < this.txids.length; iii++) {
                            const ttt = this.txids[iii];
                            if ((ttt.txid === txidItem.txid) && (ttt.idx === txidItem.idx)) {
                                console.log('continueeee');
                                existed = true;
                                break;
                            }
                        }

                        if (existed) {
                            continue;
                        }
                        txids.push(txidItem);

                        txb.addInput(utxo.txid, idx);
                        // console.log('input is');
                        // console.log(utxo.txid, utxo.idx, utxo.value);
                        receiveAddsIndexArr.push(index);
                        totalInput += utxo.value;
                        // console.log('totalInput here=', totalInput);
                        amountNum -= utxo.value;
                        amountNum += feePerInput;
                        if (((amount > 0) || (mycoin.tokenType === 'FAB')) && (amountNum <= 0)) {
                            finished = true;
                            break;
                        }
                    }
                }
                if (finished) {
                    break;
                }
            }
        }
        // console.log('totalInput here 2=', totalInput);
        if ((amount > 0) && !finished) {
            // console.log('not enough fab coin to make the transaction.');
            return { txHex: '', errMsg: 'not enough fab coin to make the transaction.', transFee: 0, txids: txids };
        }

        const changeAddress = mycoin.receiveAdds[0];

        let outputNum = 2;
        if ((mycoin.tokenType === '') && (amount === 0)) {
            outputNum = 1;
        }
        transFee = ((receiveAddsIndexArr.length + changeAddsIndexArr.length) * bytesPerInput + outputNum * 34) * satoshisPerBytes;

        const output1 = Math.round(totalInput
            - new BigNumber(this.utilServ.toBigNumber(amount + extraTransactionFee, 8)).toNumber()
            - transFee);

        if (getTransFeeOnly) {
            return { txHex: '', errMsg: '', transFee: transFee + new BigNumber(this.utilServ.toBigNumber(extraTransactionFee, 8)).toNumber(), amountInTx: amountInTx };
        }
        // const output2 = Math.round(amount * 1e8);    
        const output2 = new BigNumber(this.utilServ.toBigNumber(amount, 8));
        amountInTx = output2;
        if (output1 < 0) {
            // console.log('output1 or output2 should be greater than 0.');
            return {
                txHex: '',
                errMsg: 'output1 should be greater than 0.' + totalInput + ',' + amount + ',' + transFee + ',' + output1,
                transFee: 0, amountInTx: amountInTx, txids: txids
            };
        }
        // console.log('amount=' + amount + ',totalInput=' + totalInput);
        // console.log('defaultTransactionFee=' + extraTransactionFee);
        // console.log('(receiveAddsIndexArr.length + changeAddsIndexArr.length) * feePerInput)=' 
        // + (receiveAddsIndexArr.length + changeAddsIndexArr.length) * feePerInput);
        // console.log('output1=' + output1 + ',output2=' + output2);

        if ((amount > 0) || (mycoin.tokenType == 'FAB')) {

            txb.addOutput(changeAddress.address, output1);
            txb.addOutput(to, output2.toNumber());
        } else {
            txb.addOutput(to, output1);
        }

        for (index = 0; index < receiveAddsIndexArr.length; index++) {
            const keyPair = this.getKeyPairs(mycoin, seed, 0, receiveAddsIndexArr[index]);
            // console.log('keyPair.privateKey=' + keyPair.privateKey + ',keyPair.publicKey=' + keyPair.publicKey);
            // console.log('receiveAddsIndexArr[index]=' + receiveAddsIndexArr[index] + ',address for keypair=' + keyPair.address);
            const alice = Btc.ECPair.fromWIF(keyPair.privateKey, network);
            txb.sign(index, alice);
        }

        for (index = 0; index < changeAddsIndexArr.length; index++) {
            const keyPair = this.getKeyPairs(mycoin, seed, 1, changeAddsIndexArr[index]);
            // console.log('changeAddsIndexArr[index]=' + changeAddsIndexArr[index] + 'address for keypair=' + keyPair.address);
            const alice = Btc.ECPair.fromWIF(keyPair.privateKey, network);
            txb.sign(receiveAddsIndexArr.length + index, alice);
        }

        txHex = txb.build().toHex();
        return { txHex: txHex, errMsg: '', transFee: transFee, amountInTx: amountInTx, txids: txids };
    }

    async getFabTransactionHexWithPrivateKey(privateKey: string, mycoin: MyCoin, to: any, amount: number, extraTransactionFee: number,
        satoshisPerBytes: number, bytesPerInput: number, getTransFeeOnly: boolean) {

        extraTransactionFee = Number(extraTransactionFee);
        amount = Number(amount);
        let index = 0;
        let finished = false;
        let address = '';
        let totalInput = 0;
        let transFee = 0;
        let amountInTx = new BigNumber(0);
        const txids = [];
        const feePerInput = bytesPerInput * satoshisPerBytes;
        const receiveAddsIndexArr = [];
        const changeAddsIndexArr = [];
        // console.log('amount111111111111=', amount);
        // console.log('extraTransactionFee=', extraTransactionFee);
        const totalAmount = Number(amount) + Number(extraTransactionFee);
        // console.log('totalAmount=', totalAmount);
        let amountNum = new BigNumber(this.utilServ.toBigNumber(totalAmount, 8)).toNumber();
        // console.log('amountNum=', amountNum);
        amountNum += (2 * 34) * satoshisPerBytes;
        // console.log('amountNum=', amountNum);
        // const TestNet = Btc.networks.testnet;
        const network = environment.chains.BTC.network;

        const txb = new Btc.TransactionBuilder(network);
        // console.log('amountNum=', amountNum);
        let txHex = '';

        for (index = 0; index < mycoin.receiveAdds.length; index++) {

            address = mycoin.receiveAdds[index].address;
            // console.log('address in getFabTransactionHex=' + address);
            const fabUtxos = await this.apiService.getFabUtxos(address);

            console.log('fabUtxos==', fabUtxos);
            if (fabUtxos && fabUtxos.length) {
                // console.log('fabUtxos=', fabUtxos);
                // console.log('fabUtxos.length=', fabUtxos.length);
                for (let i = 0; i < fabUtxos.length; i++) {
                    const utxo = fabUtxos[i];
                    const idx = utxo.idx;
                    /*
                    const isLocked = await this.apiService.isFabTransactionLocked(utxo.txid, idx);
                    if (isLocked) {
                        continue;
                    }
                    */

                    const txidItem = {
                        txid: utxo.txid,
                        idx: idx
                    };

                    let existed = false;
                    for (let iii = 0; iii < this.txids.length; iii++) {
                        const ttt = this.txids[iii];
                        if ((ttt.txid === txidItem.txid) && (ttt.idx === txidItem.idx)) {
                            console.log('continueeee');
                            existed = true;
                            break;
                        }
                    }

                    if (existed) {
                        continue;
                    }

                    txids.push(txidItem);

                    txb.addInput(utxo.txid, idx);

                    console.log('input is');
                    console.log(utxo.txid, utxo.idx, utxo.value);
                    receiveAddsIndexArr.push(index);
                    totalInput += utxo.value;
                    // console.log('totalInput here=', totalInput);
                    amountNum -= utxo.value;
                    amountNum += feePerInput;
                    if (((amount > 0) || (mycoin.tokenType === 'FAB')) && (amountNum <= 0)) {
                        console.log('finished');
                        finished = true;
                        break;
                    }
                }
            }
            if (finished) {
                break;
            }
        }


        // console.log('totalInput here 2=', totalInput);
        if ((amount > 0) && !finished) {
            // console.log('not enough fab coin to make the transaction.');
            return { txHex: '', errMsg: 'not enough fab coin to make the transaction.', transFee: 0, txids: txids };
        }

        const changeAddress = mycoin.receiveAdds[0];

        let outputNum = 2;
        if ((mycoin.tokenType === '') && (amount === 0)) {
            outputNum = 1;
        }
        transFee = ((receiveAddsIndexArr.length + changeAddsIndexArr.length) * bytesPerInput + outputNum * 34) * satoshisPerBytes;

        const output1 = Math.round(totalInput
            - new BigNumber(this.utilServ.toBigNumber(amount + extraTransactionFee, 8)).toNumber()
            - transFee);

        if (getTransFeeOnly) {
            return { txHex: '', errMsg: '', transFee: transFee + new BigNumber(this.utilServ.toBigNumber(extraTransactionFee, 8)).toNumber(), amountInTx: amountInTx };
        }
        // const output2 = Math.round(amount * 1e8);    
        const output2 = new BigNumber(this.utilServ.toBigNumber(amount, 8));
        amountInTx = output2;
        if (output1 < 0) {
            // console.log('output1 or output2 should be greater than 0.');
            return {
                txHex: '',
                errMsg: 'output1 should be greater than 0.' + totalInput + ',' + amount + ',' + transFee + ',' + output1,
                transFee: 0, amountInTx: amountInTx, txids: txids
            };
        }
        // console.log('amount=' + amount + ',totalInput=' + totalInput);
        // console.log('defaultTransactionFee=' + extraTransactionFee);
        // console.log('(receiveAddsIndexArr.length + changeAddsIndexArr.length) * feePerInput)=' 
        // + (receiveAddsIndexArr.length + changeAddsIndexArr.length) * feePerInput);
        

        if ((amount > 0) || (mycoin.tokenType == 'FAB')) {

            txb.addOutput(changeAddress.address, output1);
            txb.addOutput(to, output2.toNumber());
            console.log('changeAddress.address=' + changeAddress.address + ',to=' + to);
            console.log('output1=' + output1 + ',output2=' + output2.toNumber());
        } else {
            txb.addOutput(to, output1);
        }

        for (index = 0; index < receiveAddsIndexArr.length; index++) {
           // console.log('receiveAddsIndexArr[index]=' + receiveAddsIndexArr[index] + ',address for keypair=' + keyPair.address);
            const alice = Btc.ECPair.fromWIF(privateKey, network);
            txb.sign(index, alice);
        }

        txHex = txb.build().toHex();
        return { txHex: txHex, errMsg: '', transFee: transFee, amountInTx: amountInTx, txids: txids };
    }

    getOriginalMessage(coinType: number, txHash: string, amount: BigNumber, address: string, coinTypePrefix = null) {

        let buf = '';
        const coinTypeHex = coinType.toString(16);
        if(coinTypePrefix) {
            const coinTypePrefixHex = coinTypePrefix.toString(16);
            buf += this.utilServ.fixedLengh(coinTypePrefixHex, 4);
        }
        buf += this.utilServ.fixedLengh(coinTypeHex, 8);
        buf += this.utilServ.fixedLengh(txHash, 64);
        const hexString = amount.toString(16);
        buf += this.utilServ.fixedLengh(hexString, 64);
        buf += this.utilServ.fixedLengh(address, 64);

        return buf;
    }

    async sendTransactionWithPrivateKey(mycoin: MyCoin, privateKey: string, toAddress: string, amount: number,
        options: any, doSubmit: boolean) {
            console.log('begin sendTransactionWithPrivateKey');
            let index = 0;
            let finished = false;
            let address = '';
            let totalInput = 0;
    
            let gasPrice = 0;
            let gasLimit = 0;
            let satoshisPerBytes = 0;
            let bytesPerInput = 0;
            let txHex = '';
            let txHash = '';
            let errMsg = '';
            let transFee = 0;
            let txids = [];
            let dustAmount = 2730;
            if (mycoin.name == 'DOGE') {
                dustAmount = 100000000;
            }
            let amountInTx = new BigNumber(0);
            // console.log('options=', options);
            let getTransFeeOnly = false;
            
            if (options) {
                if (options.gasPrice) {
                    gasPrice = options.gasPrice;
                }
                if (options.gasLimit) {
                    gasLimit = options.gasLimit;
                }
                if (options.satoshisPerBytes) {
                    satoshisPerBytes = options.satoshisPerBytes;
                }
                if (options.bytesPerInput) {
                    bytesPerInput = options.bytesPerInput;
                }
                if (options.getTransFeeOnly) {
                    getTransFeeOnly = options.getTransFeeOnly;
                }
            }

            const receiveAddsIndexArr = [];
            let amountNum = new BigNumber(amount).multipliedBy(new BigNumber(Math.pow(10, this.utilServ.getDecimal(mycoin))));
            // it's for all coins.
            amountNum = amountNum.plus((2 * 34) * satoshisPerBytes);
            if (mycoin.name === 'BTC' || mycoin.name === 'LTC' || mycoin.name === 'DOGE' || mycoin.name === 'BCH') { // btc address format
                if (mycoin.name === 'BCH') {
                    toAddress = bchaddr.toLegacyAddress(toAddress);
                }
                if (!satoshisPerBytes) {
                    satoshisPerBytes = environment.chains[mycoin.name].satoshisPerBytes;
                }
                if (!bytesPerInput) {
                    bytesPerInput = environment.chains[mycoin.name].bytesPerInput;
                }
                const BtcNetwork = environment.chains[mycoin.name].network;
                const txb = new Btc.TransactionBuilder(BtcNetwork);
                console.log('mycoin.receiveAdds=', mycoin.receiveAdds);
                for (index = 0; index < mycoin.receiveAdds.length; index++) {

                    address = mycoin.receiveAdds[index].address;
                    const balanceFull = await this.apiService.getUtxos(mycoin.name, address);
                    console.log('balanceFull==', balanceFull);
                    for (let i = 0; i < balanceFull.length; i++) {
                        const tx = balanceFull[i];
                        // console.log('i=' + i);
                        // console.log(tx);
                        if (tx.idx < 0) {
                            continue;
                        }
    
                        const txidItem = {
                            txid: tx.txid,
                            idx: tx.idx
                        };
    
                        let existed = false;
                        for (let iii = 0; iii < this.txids.length; iii++) {
                            const ttt = this.txids[iii];
                            if ((ttt.txid === txidItem.txid) && (ttt.idx === txidItem.idx)) {
                                existed = true;
                                break;
                            }
                        }
    
                        if (existed) {
                            continue;
                        }
    
                        txids.push(txidItem);
    
                        txb.addInput(tx.txid, tx.idx);
                        amountNum = amountNum.minus(tx.value);
                        amountNum = amountNum.plus(bytesPerInput * satoshisPerBytes);
                        totalInput += tx.value;
                        receiveAddsIndexArr.push(index);
                        if ((amount > 0) && (amountNum.isLessThanOrEqualTo(0))) {
                            finished = true;
                            break;
                        }
                    }
                    if (finished) {
                        break;
                    }
                }

                if ((amount > 0) && !finished) {
                    txHex = '';
                    txHash = '';
                    errMsg = 'not enough fund.';
                    console.log('not enough fund.');
                    return { txHex: txHex, txHash: txHash, errMsg: errMsg, amountInTx: amountInTx, txids: txids };
                }
    
                let outputNum = 2;
                if (amount === 0) {
                    outputNum = 1;
                }
    
                transFee = ((receiveAddsIndexArr.length) * bytesPerInput + outputNum * 34 + 10) * satoshisPerBytes;
    
                const changeAddress = mycoin.receiveAdds[0];
                // console.log('totalInput=' + totalInput);
                // console.log('amount=' + amount);
                // console.log('transFee=' + transFee);
                const output1 = Math.round(new BigNumber(totalInput - new BigNumber(amount).multipliedBy(new BigNumber(1e8)).toNumber() - transFee).toNumber());
    
                if (output1 < dustAmount) {
                    transFee += output1;
                }
                transFee = new BigNumber(transFee).dividedBy(new BigNumber(1e8)).toNumber();
    
                if (getTransFeeOnly) {
                    return { txHex: '', txHash: '', errMsg: '', transFee: transFee, amountInTx: amountInTx, txids: txids };
                }
                // const output2 = Math.round(new BigNumber(amount * 1e8).toNumber());  
    
                console.log('amountttttt=', amount);
                const output2 = new BigNumber(this.utilServ.toBigNumber(amount, 8));
                console.log('this.utilServ.toBigNumber(amount, 8)=', this.utilServ.toBigNumber(amount, 8));
    
                console.log('output1=', output1);
                amountInTx = output2;
                if (amount > 0) {
                    if (output1 >= dustAmount) {
                        txb.addOutput(changeAddress.address, output1);
                    }
                    txb.addOutput(toAddress, output2.toNumber());
                } else {
                    console.log('go amount = 0');
                    txb.addOutput(toAddress, output1);
                }
    
                for (index = 0; index < receiveAddsIndexArr.length; index++) {
                    const alice = Btc.ECPair.fromWIF(privateKey, BtcNetwork);
                    txb.sign(index, alice);
                }

                txHex = txb.build().toHex();
                // console.log('doSubmit=', doSubmit);
                if (doSubmit) {
                    // console.log('1');
                    const res = await this.apiService.postTx(mycoin.name, txHex);
                    txHash = res.txHash;
                    errMsg = res.errMsg;
                    // console.log(txHash);
    
                } else {
                    // console.log('2');
                    const tx = Btc.Transaction.fromHex(txHex);
                    txHash = '0x' + tx.getId();
                    // console.log(txHash);
                }
            }    
            
            else if (mycoin.name === 'FAB') {
                if (!satoshisPerBytes) {
                    satoshisPerBytes = environment.chains.FAB.satoshisPerBytes;
                }
                if (!bytesPerInput) {
                    bytesPerInput = environment.chains.FAB.bytesPerInput;
                }

                const res1 = await this.getFabTransactionHexWithPrivateKey(privateKey, mycoin, toAddress, amount, 0,
                    satoshisPerBytes, bytesPerInput, getTransFeeOnly);
                console.log('res1=', res1);
                txHex = res1.txHex;
                errMsg = res1.errMsg;
                transFee = res1.transFee;
                amountInTx = res1.amountInTx;
                txids = res1.txids;
                transFee = new BigNumber(transFee).dividedBy(new BigNumber(1e8)).toNumber();

                if (getTransFeeOnly) {
                    return { txHex: '', txHash: '', errMsg: '', transFee: transFee, amountInTx: amountInTx };
                }

                if (!errMsg && txHex) {
                    if (doSubmit) {
                        const res = await this.apiService.postFabTx(txHex);
                        txHash = res.txHash;
                        errMsg = res.errMsg;
                    } else {
                        const tx = Btc.Transaction.fromHex(txHex);
                        txHash = '0x' + tx.getId();
                    }
                }

            }     
            
            else if(mycoin.tokenType === 'FAB') {
                console.log('satoshisPerBytesgggg=', satoshisPerBytes);
                if (!gasPrice) {
                    gasPrice = environment.chains.FAB.gasPrice;
                }
                if (!gasLimit) {
                    gasLimit = environment.chains.FAB.gasLimit;
                }
                if (!satoshisPerBytes) {
                    satoshisPerBytes = environment.chains.FAB.satoshisPerBytes;
                }
                if (!bytesPerInput) {
                    bytesPerInput = environment.chains.FAB.bytesPerInput;
                }
                console.log('gasPrice final=', gasPrice);
                let decimals = mycoin.decimals;
                if (!decimals) {
                    decimals = 18;
                }
                // const amountSent = BigInt(amount * Math.pow(10, decimals));
                // const amountSent = new BigNumber(amount).multipliedBy(new BigNumber(Math.pow(10, decimals)));
                const amountSent = this.utilServ.toBigNumber(amount, decimals);
                // const abiHex = this.web3Serv.getFabTransferABI([toAddress, amountSent.toString()]);

                const funcTransfer: any = {
                    'constant': false,
                    'inputs': [
                        {
                            'name': 'to',
                            'type': 'address'
                        },
                        {
                            'name': 'value',
                            'type': 'uint256'
                        }
                    ],
                    'name': 'transfer',
                    'outputs': [
                        {
                            'name': '',
                            'type': 'bool'
                        }
                    ],
                    'payable': false,
                    'stateMutability': 'nonpayable',
                    'type': 'function'
                };
                // console.log('foreeeee');
                console.log('amountSent=', amountSent);
                console.log('toAddress===', toAddress);
                amountInTx = new BigNumber(amountSent);
                let fxnCallHex = this.web3Serv.getGeneralFunctionABI(funcTransfer, [toAddress, amountSent]);
                // console.log('enddddd');
                fxnCallHex = this.utilServ.stripHexPrefix(fxnCallHex);
                let contractAddress = mycoin.contractAddr;
                if (mycoin.name === 'EXG') {
                    contractAddress = environment.addresses.smartContract.EXG;
                } else if (mycoin.name === 'DUSD') {
                    contractAddress = environment.addresses.smartContract.DUSD;
                }

                // const keyPair = this.getKeyPairs(mycoin, seed, 0, 0);

                // contractAddress = '0x28a6efffaf9f721a1e95667e3de54c622edc5ffa';
                contractAddress = this.utilServ.stripHexPrefix(contractAddress);
                // console.log('contractAddress=' + contractAddress);

                const totalAmount = gasLimit * gasPrice / 1e8;
                console.log('totalAmount==', totalAmount);
                // let cFee = 3000 / 1e8 // fee for the transaction

                // console.log('fxnCallHex=' + fxnCallHex);
                let totalFee = totalAmount;
                const contract = Btc.script.compile([
                    84,
                    this.utilServ.number2Buffer(gasLimit),
                    this.utilServ.number2Buffer(gasPrice),
                    this.utilServ.hex2Buffer(fxnCallHex),
                    this.utilServ.hex2Buffer(contractAddress),
                    194
                ]);

                // console.log('contract=====', contract);
                const contractSize = contract.toJSON.toString().length;

                // console.log('contractSize=' + contractSize);
                totalFee += this.utilServ.convertLiuToFabcoin(contractSize * 10);

               const baseCoin = mycoin.baseCoin;
                baseCoin.tokenType = 'FAB';
                console.log('totalFee==', totalFee);
                const res1 = await this.getFabTransactionHexWithPrivateKey(privateKey, baseCoin, contract, 0, totalFee,
                    satoshisPerBytes, bytesPerInput, getTransFeeOnly);

                baseCoin.tokenType = '';
                // console.log('res1=', res1);
                txHex = res1.txHex;
                errMsg = res1.errMsg;
                transFee = res1.transFee;
                txids = res1.txids;
                transFee = new BigNumber(transFee).dividedBy(new BigNumber(1e8)).toNumber();

                if (getTransFeeOnly) {
                    return { txHex: '', txHash: '', errMsg: '', transFee: transFee, amountInTx: amountInTx, txids: txids };
                }

                if (txHex) {
                    if (doSubmit) {
                        const res = await this.apiService.postFabTx(txHex);
                        txHash = res.txHash;
                        errMsg = res.errMsg;
                    } else {
                        const tx = Btc.Transaction.fromHex(txHex);
                        txHash = '0x' + tx.getId();
                    }
                }
            }

            
            
            
            const ret = { txHex: txHex, txHash: txHash, errMsg: errMsg, transFee: transFee, amountInTx: amountInTx, txids: txids };
            console.log('ret there from sendTransactionInPrivateKey=', ret);
            return ret;
    }
    async sendTransaction(mycoin: MyCoin, seed: Buffer, toAddress: string, amount: number,
        options: any, doSubmit: boolean) {

        let index = 0;
        let finished = false;
        let address = '';
        let totalInput = 0;

        let gasPrice = 0;
        let gasLimit = 0;
        let satoshisPerBytes = 0;
        let bytesPerInput = 0;
        let txHex = '';
        let txHash = '';
        let errMsg = '';
        let transFee = 0;
        let txids = [];
        let dustAmount = 2730;
        if (mycoin.name == 'DOGE') {
            dustAmount = 100000000;
        }
        let amountInTx = new BigNumber(0);
        // console.log('options=', options);
        let getTransFeeOnly = false;
        if (options) {
            console.log('optionsoptionsoptions=', options);
            if (options.gasPrice) {
                gasPrice = options.gasPrice;
            }
            if (options.gasLimit) {
                gasLimit = options.gasLimit;
            }
            if (options.satoshisPerBytes) {
                satoshisPerBytes = options.satoshisPerBytes;
            }
            if (options.bytesPerInput) {
                bytesPerInput = options.bytesPerInput;
            }
            if (options.getTransFeeOnly) {
                getTransFeeOnly = options.getTransFeeOnly;
            }
        }
        console.log('satoshisPerBytes=', satoshisPerBytes);
        const receiveAddsIndexArr = [];
        const changeAddsIndexArr = [];

        // console.log('mycoin=');
        // console.log(mycoin);

        // let amountNum = amount * Math.pow(10, this.utilServ.getDecimal(mycoin));
        let amountNum = new BigNumber(amount).multipliedBy(new BigNumber(Math.pow(10, this.utilServ.getDecimal(mycoin))));
        // it's for all coins.
        amountNum = amountNum.plus((2 * 34) * satoshisPerBytes);
        console.log('amountNum=', amountNum.toString());
        // 2 output
        // console.log('toAddress=' + toAddress + ',amount=' + amount + ',amountNum=' + amountNum);

        if (mycoin.name === 'BTC' || mycoin.name === 'LTC' || mycoin.name === 'DOGE' || mycoin.name === 'BCH') { // btc address format
            if (mycoin.name === 'BCH') {
                toAddress = bchaddr.toLegacyAddress(toAddress);
            }
            if (!satoshisPerBytes) {
                satoshisPerBytes = environment.chains[mycoin.name].satoshisPerBytes;
            }
            if (!bytesPerInput) {
                bytesPerInput = environment.chains[mycoin.name].bytesPerInput;
            }
            const BtcNetwork = environment.chains[mycoin.name].network;
            const txb = new Btc.TransactionBuilder(BtcNetwork);

            for (index = 0; index < mycoin.receiveAdds.length; index++) {
                /*
                balance = mycoin.receiveAdds[index].balance;
                if (balance <= 0) {
                    continue;
                }
                */
                address = mycoin.receiveAdds[index].address;
                const balanceFull = await this.apiService.getUtxos(mycoin.name, address);
                for (let i = 0; i < balanceFull.length; i++) {
                    const tx = balanceFull[i];
                    // console.log('i=' + i);
                    // console.log(tx);
                    if (tx.idx < 0) {
                        continue;
                    }

                    const txidItem = {
                        txid: tx.txid,
                        idx: tx.idx
                    };

                    let existed = false;
                    for (let iii = 0; iii < this.txids.length; iii++) {
                        const ttt = this.txids[iii];
                        if ((ttt.txid === txidItem.txid) && (ttt.idx === txidItem.idx)) {
                            existed = true;
                            break;
                        }
                    }

                    if (existed) {
                        continue;
                    }

                    txids.push(txidItem);

                    txb.addInput(tx.txid, tx.idx);
                    amountNum = amountNum.minus(tx.value);
                    amountNum = amountNum.plus(bytesPerInput * satoshisPerBytes);
                    totalInput += tx.value;
                    receiveAddsIndexArr.push(index);
                    if ((amount > 0) && (amountNum.isLessThanOrEqualTo(0))) {
                        finished = true;
                        break;
                    }
                }
                if (finished) {
                    break;
                }
            }
            if (!finished) {
                for (index = 0; index < mycoin.changeAdds.length; index++) {
                    /*
                    balance = mycoin.changeAdds[index].balance;
                    if (balance <= 0) {
                        continue;
                    }
                    */
                    address = mycoin.changeAdds[index].address;
                    const balanceFull = await this.apiService.getBtcUtxos(address);
                    for (let i = 0; i < balanceFull.length; i++) {
                        const tx = balanceFull[i];
                        // console.log('i=' + i);
                        // console.log(tx);
                        if (tx.idx < 0) {
                            continue;
                        }

                        const txidItem = {
                            txid: tx.txid,
                            idx: tx.idx
                        };
                        let existed = false;
                        for (let iii = 0; iii < this.txids.length; iii++) {
                            const ttt = this.txids[iii];
                            if ((ttt.txid === txidItem.txid) && (ttt.idx === txidItem.idx)) {
                                console.log('continueeee');
                                existed = true;
                                break;
                            }
                        }

                        if (existed) {
                            continue;
                        }
                        txids.push(txidItem);
                        txb.addInput(tx.txid, tx.idx);
                        amountNum = amountNum.minus(tx.value);
                        amountNum = amountNum.plus(bytesPerInput * satoshisPerBytes);
                        totalInput += tx.value;
                        changeAddsIndexArr.push(index);

                        if ((amount > 0) && (amountNum.isLessThanOrEqualTo(0))) {
                            finished = true;
                            break;
                        }
                    }
                    if (finished) {
                        break;
                    }
                }
            }

            if ((amount > 0) && !finished) {
                txHex = '';
                txHash = '';
                errMsg = 'not enough fund.';
                return { txHex: txHex, txHash: txHash, errMsg: errMsg, amountInTx: amountInTx, txids: txids };
            }

            let outputNum = 2;
            if (amount === 0) {
                outputNum = 1;
            }

            transFee = ((receiveAddsIndexArr.length + changeAddsIndexArr.length) * bytesPerInput + outputNum * 34 + 10) * satoshisPerBytes;

            const changeAddress = mycoin.receiveAdds[0];
            // console.log('totalInput=' + totalInput);
            // console.log('amount=' + amount);
            // console.log('transFee=' + transFee);
            const output1 = Math.round(new BigNumber(totalInput - new BigNumber(amount).multipliedBy(new BigNumber(1e8)).toNumber() - transFee).toNumber());

            if (output1 < dustAmount) {
                transFee += output1;
            }
            transFee = new BigNumber(transFee).dividedBy(new BigNumber(1e8)).toNumber();

            if (getTransFeeOnly) {
                return { txHex: '', txHash: '', errMsg: '', transFee: transFee, amountInTx: amountInTx, txids: txids };
            }
            // const output2 = Math.round(new BigNumber(amount * 1e8).toNumber());  

            console.log('amountttttt=', amount);
            const output2 = new BigNumber(this.utilServ.toBigNumber(amount, 8));
            console.log('this.utilServ.toBigNumber(amount, 8)=', this.utilServ.toBigNumber(amount, 8));

            console.log('output1=', output1);
            amountInTx = output2;
            if (amount > 0) {
                if (output1 >= dustAmount) {
                    txb.addOutput(changeAddress.address, output1);
                }
                txb.addOutput(toAddress, output2.toNumber());
            } else {
                console.log('go amount = 0');
                txb.addOutput(toAddress, output1);
            }

            for (index = 0; index < receiveAddsIndexArr.length; index++) {
                const keyPair = this.getKeyPairs(mycoin, seed, 0, receiveAddsIndexArr[index]);
                const alice = Btc.ECPair.fromWIF(keyPair.privateKey, BtcNetwork);
                txb.sign(index, alice);
            }

            for (index = 0; index < changeAddsIndexArr.length; index++) {
                const keyPair = this.getKeyPairs(mycoin, seed, 1, changeAddsIndexArr[index]);
                const alice = Btc.ECPair.fromWIF(keyPair.privateKey, BtcNetwork);
                txb.sign(receiveAddsIndexArr.length + index, alice);
            }

            txHex = txb.build().toHex();
            // console.log('doSubmit=', doSubmit);
            if (doSubmit) {
                // console.log('1');
                const res = await this.apiService.postTx(mycoin.name, txHex);
                txHash = res.txHash;
                errMsg = res.errMsg;
                // console.log(txHash);

            } else {
                // console.log('2');
                const tx = Btc.Transaction.fromHex(txHex);
                txHash = '0x' + tx.getId();
                // console.log(txHash);
            }
        } else

        if (mycoin.name === 'FAB') {
                if (!satoshisPerBytes) {
                    satoshisPerBytes = environment.chains.FAB.satoshisPerBytes;
                }
                if (!bytesPerInput) {
                    bytesPerInput = environment.chains.FAB.bytesPerInput;
                }

                const res1 = await this.getFabTransactionHex(seed, mycoin, toAddress, amount, 0,
                    satoshisPerBytes, bytesPerInput, getTransFeeOnly);
                console.log('res1=', res1);
                txHex = res1.txHex;
                errMsg = res1.errMsg;
                transFee = res1.transFee;
                amountInTx = res1.amountInTx;
                txids = res1.txids;
                transFee = new BigNumber(transFee).dividedBy(new BigNumber(1e8)).toNumber();

                if (getTransFeeOnly) {
                    return { txHex: '', txHash: '', errMsg: '', transFee: transFee, amountInTx: amountInTx };
                }

                if (!errMsg && txHex) {
                    if (doSubmit) {
                        const res = await this.apiService.postFabTx(txHex);
                        txHash = res.txHash;
                        errMsg = res.errMsg;
                    } else {
                        const tx = Btc.Transaction.fromHex(txHex);
                        txHash = '0x' + tx.getId();
                    }
                }

        } else if (mycoin.name == 'TRX') {
            console.log('start to send TRX');

            if (getTransFeeOnly) {
                return { txHex: '', txHash: '', errMsg: '', transFee: 0, amountInTx: 0, txids: '' };
            }            
            const address1 = mycoin.receiveAdds[0];
            const currentIndex = address1.index;            
            const keyPair = this.getKeyPairs(mycoin, seed, 0, currentIndex);
            let priKeyDisp = keyPair.privateKey.toString('hex');

            

            amountInTx = new BigNumber(this.utilServ.toBigNumber(amount, 6));
            const amountNum = amountInTx.toNumber();

            const tradeobj = await tronWeb.transactionBuilder.sendTrx(toAddress, amountNum, keyPair.address);

            const txHexObj = await tronWeb.trx.sign(tradeobj, priKeyDisp);

            if (txHexObj) {
                if (doSubmit) {
                    const receipt = await tronWeb.trx.sendRawTransaction(txHexObj);
                    txHex = txHexObj.raw_data_hex;
                    txHash = receipt.transaction.txID;
                    errMsg = '';
                } else {
                    txHex = txHexObj.raw_data_hex;
                    txHash = txHexObj.txID;
                }
            }
        } else 
        if (mycoin.tokenType == 'TRX') {

            if (getTransFeeOnly) {
                return { txHex: '', txHash: '', errMsg: '', transFee: 0, amountInTx: 0, txids: '' };
            }              
            const trc20ContractAddress = environment.addresses.smartContract[mycoin.name + '_TRX'];//contract address
            const address1 = mycoin.receiveAdds[0];
            const currentIndex = address1.index;            
            const keyPair = this.getKeyPairs(mycoin, seed, 0, currentIndex);
            let priKeyDisp = keyPair.privateKey.toString('hex');
            const tronWeb = new TronWeb(
                fullNode,
                solidityNode,
                eventServer,
                priKeyDisp
            );

            amountInTx = new BigNumber(this.utilServ.toBigNumber(amount, mycoin.decimals));
            const amountNum = amountInTx.toNumber();            

            
            try {
                let contract = await tronWeb.contract().at(trc20ContractAddress);
                console.log('gogogo');
                //Use call to execute a pure or view smart contract method.
                // These methods do not modify the blockchain, do not cost anything to execute and are also not broadcasted to the network.
                if (doSubmit) {

                    txHash = await contract.transfer(
                        toAddress, //address _to
                        amountNum   //amount
                    ).send({
                        feeLimit: 1000000
                    });
                } else {

                    /*
                    const functionSelector = 'transfer(address,uint256)';

                    const options= {
                        feeLimit: 1000000,
                        callValue: 0,
                        userFeePercentage: 100,
                        shouldPollResponse: false,
                        from: '41de44a0022fa24706a1d23756d418980ff321db84'
                    };

                    const parameters = [
                        {
                          type: 'address',
                          value: '0xb2c57719f8ff16f9f20952947fb09601e465ce2d'
                        },
                        { type: 'uint256', value: amountNum }
                    ];

                     const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
                        trc20ContractAddress,
                        functionSelector,
                        options,
                        parameters,
                        ''
                    );
                    const txHexObj = await tronWeb.trx.sign(transaction.transaction, priKeyDisp);
                    txHex = txHexObj.raw_data_hex;
                    txHash = txHexObj.txID;
                    */

                   const functionSelector = 'transfer(address,uint256)';

                   const options= {
                       feeLimit: 2000000,
                       callValue: 0,
                       userFeePercentage: 100,
                       shouldPollResponse: false,
                       from: tronWeb.address.toHex(keyPair.address)
                   };
            
                   const parameters = [
                       {
                         type: 'address',
                         value: tronWeb.address.toHex(toAddress).replace(ADDRESS_PREFIX_REGEX, '0x')
                       },
                       { type: 'uint256', value: amountNum }
                   ];
            
            
                   console.log('1=', tronWeb.address.toHex(trc20ContractAddress));
                   console.log('2=', functionSelector);
                   console.log('3=', options);
                   console.log('4=', parameters);
                   console.log('5=', tronWeb.address.toHex(keyPair.address));
                    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(
                        tronWeb.address.toHex(trc20ContractAddress),
                       functionSelector,
                       options,
                       parameters,
                       tronWeb.address.toHex(keyPair.address)
                   );
            
                   const txHexObj = await tronWeb.trx.sign(transaction.transaction, priKeyDisp);
                   const raw_dat_hex = txHexObj.raw_data_hex;
                   txHash = txHexObj.txID;
                   txHex = '0a' + (raw_dat_hex.length / 2).toString(16) + '01' + raw_dat_hex + '1241' + txHexObj.signature;
                    console.log('txHex=', txHex);
                }
                
                
            } catch(error) {
                console.error("trigger smart contract error",error)
            }            
        }

        else if (mycoin.name === 'ETH') {
                if (!gasPrice) {
                    gasPrice = environment.chains.ETH.gasPrice;
                }
                if (!gasLimit) {
                    gasLimit = environment.chains.ETH.gasLimit;
                }
                transFee = Number(new BigNumber(gasPrice).multipliedBy(new BigNumber(gasLimit)).dividedBy(new BigNumber(1e9)).toFixed(6));
                if (getTransFeeOnly) {
                    return { txHex: '', txHash: '', errMsg: '', transFee: transFee, amountInTx: amountInTx, txids: txids };
                }
                // amountNum = amount * 1e18;
                amountNum = new BigNumber(amount).multipliedBy(new BigNumber(Math.pow(10, 18)));
                const address1 = mycoin.receiveAdds[0];
                const currentIndex = address1.index;

                const keyPair = this.getKeyPairs(mycoin, seed, 0, currentIndex);
                const nonce = await this.apiService.getEthNonce(address1.address);
                const gasPriceFinal = new BigNumber(gasPrice).multipliedBy(new BigNumber(1e9)).toNumber();

                amountInTx = amountNum;

                console.log('amountNum.toString(16)==', amountNum.toString(16));
                const txParams = {
                    nonce: nonce,
                    gasPrice: gasPriceFinal,
                    gasLimit: gasLimit,
                    to: toAddress,
                    value: '0x' + amountNum.toString(16)
                };

                // console.log('txParams=', txParams);
                txHex = await this.web3Serv.signTxWithPrivateKey(txParams, keyPair);

                // console.log('txhex for etheruem:', txHex);
                if (doSubmit) {
                    const retEth = await this.apiService.postEthTx(txHex);
                    txHash = retEth.txHash;
                    errMsg = retEth.errMsg;
                    if (txHash.indexOf('txerError') >= 0) {
                        errMsg = txHash;
                        txHash = '';
                    }
                } else {
                    txHash = this.web3Serv.getTransactionHash(txHex);
                }
        } else if (mycoin.tokenType === 'ETH') { // etheruem tokens
                const address1 = mycoin.receiveAdds[0];
                if (!gasPrice) {
                    gasPrice = environment.chains.ETH.gasPrice;
                }
                if (!gasLimit) {
                    gasLimit = environment.chains.ETH.gasLimitToken;
                }
                transFee = new BigNumber(gasPrice).multipliedBy(new BigNumber(gasLimit)).dividedBy(new BigNumber(1e9)).toNumber();
                if (getTransFeeOnly) {
                    return { txHex: '', txHash: '', errMsg: '', transFee: transFee, amountInTx: amountInTx, txids: txids };
                }
                const currentIndex = address1.index;
                // console.log('currentIndex=' + currentIndex);
                const keyPair = this.getKeyPairs(mycoin, seed, 0, currentIndex);
                const nonce = await this.apiService.getEthNonce(address1.address);

                let decimals = mycoin.decimals;

                if (!decimals) {
                    decimals = 18;
                }
                console.log('decimals112===', decimals);
                // const amountSent = amount * Math.pow(10, decimals);
                const amountSent = new BigNumber(amount).multipliedBy(new BigNumber(Math.pow(10, decimals)));
                const toAccount = toAddress;
                let contractAddress = environment.addresses.smartContract[mycoin.name];

                console.log('contractAddress theee=', contractAddress);
                if (mycoin.name === 'USDT') {
                    contractAddress = environment.addresses.smartContract.USDT;
                }
                // console.log('nonce = ' + nonce);
                const func = {
                    'constant': false,
                    'inputs': [
                        {
                            'name': 'recipient',
                            'type': 'address'
                        },
                        {
                            'name': 'amount',
                            'type': 'uint256'
                        }
                    ],
                    'name': 'transfer',
                    'outputs': [
                        {
                            'name': '',
                            'type': 'bool'
                        }
                    ],
                    'payable': false,
                    'stateMutability': 'nonpayable',
                    'type': 'function'
                };

                const abiHex = this.web3Serv.getFuncABI(func);
                // a9059cbb
                // console.log('abiHexxx=' + abiHex);
                const gasPriceFinal = new BigNumber(gasPrice).multipliedBy(new BigNumber(1e9)).toNumber();

                amountInTx = amountSent;
                const txData = {
                    nonce: nonce,
                    gasPrice: gasPriceFinal,
                    gasLimit: gasLimit,
                    // to: contractAddress,
                    from: keyPair.address,
                    value: Number(0),
                    to: contractAddress,
                    data: '0x' + abiHex + this.utilServ.fixedLengh(toAccount.slice(2), 64) +
                        this.utilServ.fixedLengh(amountSent.toString(16), 64)
                };
                console.log('txData==', txData);
                txHex = await this.web3Serv.signTxWithPrivateKey(txData, keyPair);
                // console.log('after sign');
                if (doSubmit) {
                    // console.log('111');
                    const retEth = await this.apiService.postEthTx(txHex);
                    txHash = retEth.txHash;
                    errMsg = retEth.errMsg;

                    if (txHash.indexOf('txerError') >= 0) {
                        errMsg = txHash;
                        txHash = '';
                    }
                } else {
                    // console.log('333');
                    txHash = this.web3Serv.getTransactionHash(txHex);
                    // console.log('444');
                }
        } else if (mycoin.tokenType === 'FAB') { // fab tokens
                console.log('satoshisPerBytesgggg=', satoshisPerBytes);
                if (!gasPrice) {
                    gasPrice = environment.chains.FAB.gasPrice;
                }
                if (!gasLimit) {
                    gasLimit = environment.chains.FAB.gasLimit;
                }
                if (!satoshisPerBytes) {
                    satoshisPerBytes = environment.chains.FAB.satoshisPerBytes;
                }
                if (!bytesPerInput) {
                    bytesPerInput = environment.chains.FAB.bytesPerInput;
                }
                console.log('gasPrice final=', gasPrice);
                let decimals = mycoin.decimals;
                if (!decimals) {
                    decimals = 18;
                }
                // const amountSent = BigInt(amount * Math.pow(10, decimals));
                // const amountSent = new BigNumber(amount).multipliedBy(new BigNumber(Math.pow(10, decimals)));
                const amountSent = this.utilServ.toBigNumber(amount, decimals);
                // const abiHex = this.web3Serv.getFabTransferABI([toAddress, amountSent.toString()]);

                const funcTransfer: any = {
                    'constant': false,
                    'inputs': [
                        {
                            'name': 'to',
                            'type': 'address'
                        },
                        {
                            'name': 'value',
                            'type': 'uint256'
                        }
                    ],
                    'name': 'transfer',
                    'outputs': [
                        {
                            'name': '',
                            'type': 'bool'
                        }
                    ],
                    'payable': false,
                    'stateMutability': 'nonpayable',
                    'type': 'function'
                };
                // console.log('foreeeee');
                console.log('amountSent=', amountSent);
                console.log('toAddress===', toAddress);
                amountInTx = new BigNumber(amountSent);
                let fxnCallHex = this.web3Serv.getGeneralFunctionABI(funcTransfer, [toAddress, amountSent]);
                // console.log('enddddd');
                fxnCallHex = this.utilServ.stripHexPrefix(fxnCallHex);
                let contractAddress = mycoin.contractAddr;
                if (mycoin.name === 'EXG') {
                    contractAddress = environment.addresses.smartContract.EXG;
                } else if (mycoin.name === 'DUSD') {
                    contractAddress = environment.addresses.smartContract.DUSD;
                }

                // const keyPair = this.getKeyPairs(mycoin, seed, 0, 0);

                // contractAddress = '0x28a6efffaf9f721a1e95667e3de54c622edc5ffa';
                contractAddress = this.utilServ.stripHexPrefix(contractAddress);
                // console.log('contractAddress=' + contractAddress);

                const totalAmount = gasLimit * gasPrice / 1e8;
                console.log('totalAmount==', totalAmount);
                // let cFee = 3000 / 1e8 // fee for the transaction

                // console.log('fxnCallHex=' + fxnCallHex);
                let totalFee = totalAmount;
                const contract = Btc.script.compile([
                    84,
                    this.utilServ.number2Buffer(gasLimit),
                    this.utilServ.number2Buffer(gasPrice),
                    this.utilServ.hex2Buffer(fxnCallHex),
                    this.utilServ.hex2Buffer(contractAddress),
                    194
                ]);

                // console.log('contract=====', contract);
                const contractSize = contract.toJSON.toString().length;

                // console.log('contractSize=' + contractSize);
                totalFee += this.utilServ.convertLiuToFabcoin(contractSize * 10);

                // console.log('totalFee=' + totalFee);
                console.log('satoshisPerBytessatoshisPerBytessatoshisPerBytes=', satoshisPerBytes);
                const baseCoin = mycoin.baseCoin;
                baseCoin.tokenType = 'FAB';
                console.log('totalFee==', totalFee);
                const res1 = await this.getFabTransactionHex(seed, baseCoin, contract, 0, totalFee,
                    satoshisPerBytes, bytesPerInput, getTransFeeOnly);

                baseCoin.tokenType = '';
                // console.log('res1=', res1);
                txHex = res1.txHex;
                errMsg = res1.errMsg;
                transFee = res1.transFee;
                txids = res1.txids;
                transFee = new BigNumber(transFee).dividedBy(new BigNumber(1e8)).toNumber();

                if (getTransFeeOnly) {
                    return { txHex: '', txHash: '', errMsg: '', transFee: transFee, amountInTx: amountInTx, txids: txids };
                }

                if (txHex) {
                    if (doSubmit) {
                        const res = await this.apiService.postFabTx(txHex);
                        txHash = res.txHash;
                        errMsg = res.errMsg;
                    } else {
                        const tx = Btc.Transaction.fromHex(txHex);
                        txHash = '0x' + tx.getId();
                    }
                }
            }
        const ret = { txHex: txHex, txHash: txHash, errMsg: errMsg, transFee: transFee, amountInTx: amountInTx, txids: txids };
        console.log('ret there eeee=', ret);
        return ret;
    }

    fillUpAddress(mycoin: MyCoin, seed: Buffer, numReceiveAdds: number, numberChangeAdds: number) {
        // console.log('fillUpAddress for MyCoin');
        // console.log(mycoin);
        for (let i = 0; i < numReceiveAdds; i++) {
            const keyPair = this.getKeyPairs(mycoin, seed, 0, i);
            const addr = new Address(mycoin.coinType, keyPair.address, i);
            mycoin.receiveAdds.push(addr);
        }
        for (let i = 0; i < numberChangeAdds; i++) {
            const keyPair = this.getKeyPairs(mycoin, seed, 1, i);
            const addr = new Address(mycoin.coinType, keyPair.address, i);
            mycoin.changeAdds.push(addr);
        }

    }

    fillUpAddressByPrivateKey(coin: MyCoin, privateKey: string) {
        const keyPair = this.getKeyPairsFromPrivateKey(coin, privateKey);
        const addr = new Address(coin.coinType, keyPair.address, 0);
        coin.receiveAdds.push(addr);
    }

    async updateCoinBalance(coin: MyCoin) {
        const balance = await this.getBalance(coin);
        coin.balance = balance.balance;
        coin.lockedBalance = balance.lockbalance;
    }
}
