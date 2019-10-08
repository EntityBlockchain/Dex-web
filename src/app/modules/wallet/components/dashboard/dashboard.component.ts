import { Component, ViewEncapsulation, TemplateRef, ViewChild, ViewContainerRef, OnInit  } from '@angular/core';
import { Router } from '@angular/router';
import { Wallet } from '../../../../models/wallet';
import { MyCoin } from '../../../../models/mycoin';
import { WalletService } from '../../../../services/wallet.service';
import { CoinService } from '../../../../services/coin.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { UtilService } from '../../../../services/util.service';
import { ApiService } from '../../../../services/api.service';
import {KanbanService} from '../../../../services/kanban.service';
import {Web3Service} from '../../../../services/web3.service';
import {Signature, Token} from '../../../../interfaces/kanban.interface';
import { DepositAmountModal } from '../../modals/deposit-amount/deposit-amount.modal';
import { WithdrawAmountModal } from '../../modals/withdraw-amount/withdraw-amount.modal';
import { AddAssetsModal } from '../../modals/add-assets/add-assets.modal';
import { PinNumberModal } from '../../modals/pin-number/pin-number.modal';
import { AddGasModal } from '../../modals/add-gas/add-gas.modal';
import { ShowSeedPhraseModal } from '../../modals/show-seed-phrase/show-seed-phrase.modal';
import { VerifySeedPhraseModal } from '../../modals/verify-seed-phrase/verify-seed-phrase.modal';
import { SendCoinModal } from '../../modals/send-coin/send-coin.modal';
import { BackupPrivateKeyModal } from '../../modals/backup-private-key/backup-private-key.modal';
import { DeleteWalletModal } from '../../modals/delete-wallet/delete-wallet.modal';
import { LoginSettingModal } from '../../modals/login-setting/login-setting.modal';
import {CoinsPrice} from '../../../../interfaces/balance.interface';
import {SendCoinForm} from '../../../../interfaces/kanban.interface';
import {StorageService} from '../../../../services/storage.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import { AngularCsv } from 'angular7-csv';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({ 
    selector: 'app-wallet-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class WalletDashboardComponent {
    @ViewChild('pinModal', {static: true}) pinModal: PinNumberModal;
    @ViewChild('depositModal', {static: true}) depositModal: DepositAmountModal;
    @ViewChild('withdrawModal', {static: true}) withdrawModal: WithdrawAmountModal;
    @ViewChild('addGasModal', {static: true}) addGasModal: AddGasModal;
    @ViewChild('addAssetsModal', {static: true}) addAssetsModal: AddAssetsModal;
    @ViewChild('sendCoinModal', {static: true}) sendCoinModal: SendCoinModal;
    @ViewChild('showSeedPhraseModal', {static: true}) showSeedPhraseModal: ShowSeedPhraseModal;
    @ViewChild('verifySeedPhraseModal', {static: true}) verifySeedPhraseModal: VerifySeedPhraseModal;
    @ViewChild('backupPrivateKeyModal', {static: true}) backupPrivateKeyModal: BackupPrivateKeyModal;
    @ViewChild('deleteWalletModal', {static: true}) deleteWalletModal: DeleteWalletModal;
    @ViewChild('loginSettingModal', {static: true}) loginSettingModal: LoginSettingModal;
    
    sendCoinForm: SendCoinForm;
    wallet: Wallet; 
    wallets: Wallet[];
    modalRef: BsModalRef;
    checked = true;
    exgAddress: string;
    exgBalance: number;
    currentWalletIndex: number;
    currentCoin: MyCoin;
    amount: number;
    coinsPrice: CoinsPrice;
    pin: string;
    seed: Buffer;
    hideSmall: boolean;
    showMyAssets: boolean;
    showTransactionHistory: boolean;
    gas: number;
    opType: string;

    constructor ( private route: Router, private walletServ: WalletService, private modalServ: BsModalService, 
        private coinServ: CoinService, private utilServ: UtilService, private apiServ: ApiService, 
        private kanbanServ: KanbanService, private web3Serv: Web3Service, private viewContainerRef: ViewContainerRef,
        private utilService: UtilService, private _snackBar: MatSnackBar, private matIconRegistry: MatIconRegistry,
        private coinService: CoinService, private storageService: StorageService, private domSanitizer: DomSanitizer) {
        this.showMyAssets = true;
        this.showTransactionHistory = false;
        this.matIconRegistry.addSvgIcon(
            'icon_copy',
            this.domSanitizer.bypassSecurityTrustResourceUrl('/images/copy.svg')
          );
    }

    async ngOnInit() {
        await this.loadWallets();
        //this.currentWalletIndex = await this.walletServ.getCurrentWalletIndex();
        console.log('this.currentWalletIndex=', this.currentWalletIndex);
        if (this.currentWalletIndex == null) {
            this.currentWalletIndex = 0;
        }
        this.loadWallet(this.wallets[this.currentWalletIndex]);
        this.loadCoinsPrice();

        //this.startTimer();
        this.loadBalance();        
    }

    copyAddress() {
        this.utilServ.copy(this.exgAddress);
    }

    onConfirmedBackupPrivateKey(cmd: string) {
        console.log('onConfirmedBackupPrivateKey start, cmd=', cmd);

        const options = { 
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalseparator: '.',
            showLabels: false, 
            showTitle: false,
            title: 'Your title',
            useBom: true,
            noDownload: false,
            headers: ['Coin', 'Chain', 'Index', 'Address', 'Private Key']
        };        
        const data = [];
        
        for (let i = 0; i < this.wallet.mycoins.length; i++) {
            const coin = this.wallet.mycoins[i];
            for (let j = 0; j < coin.receiveAdds.length; j++) {
                const addr = coin.receiveAdds[j];
                const keyPair = this.coinServ.getKeyPairs(coin, this.seed, 0, addr.index);
                const item = {
                    coin: coin.name,
                    chain: 'external',
                    index: addr.index,
                    address: addr.address,
                    privateKey: keyPair.privateKeyDisplay
                };
                data.push(item);
            }

            for (let j = 0; j < coin.changeAdds.length; j++) {
                const addr = coin.changeAdds[j];
                const keyPair = this.coinServ.getKeyPairs(coin, this.seed, 1, addr.index);
                const item = {
                    coin: coin.name,
                    chain: 'change',
                    index: addr.index,
                    address: addr.address,
                    privateKey: keyPair.privateKeyDisplay
                };
                data.push(item);
            }            
        }
        const csv = new AngularCsv(data, 'Private Keys for wallet ' + this.wallet.name, options);
    }

    onShowMyAssets() {
        this.showMyAssets = true;
        this.showTransactionHistory = false;
    }

    onmanageWallet(type: string) {
        console.log('type in dashboard=' + type);
        if (type === 'SHOW_SEED_PHRASE') {
            this.opType = 'showSeedPhrase';
            this.pinModal.show();            
        } else 
        if (type === 'VERIFY_SEED_PHRASE') {
            this.opType = 'verifySeedPhrase';
            this.pinModal.show();            
        } else 
        if (type === 'BACKUP_PRIVATE_KEY') {
            this.opType = 'backupPrivateKey';
            this.pinModal.show();  0x5cae65c0d1e6c8fbbe34b2962119f88806057f30
        } else 
        if (type === 'DELETE_WALLET') {
            this.opType = 'deleteWallet';
            this.pinModal.show();  
        } else
        if (type === 'LOGIN_SETTING') {
            this.opType = 'loginSetting';
            this.pinModal.show();
        }        
    }

    onShowTransactionHistory() {
        this.showMyAssets = false;
        this.showTransactionHistory = true;
    }

    async onConfirmedDeleteWallet() {
        console.log('confirm delete it.');
        //this.walletServ.deleteCurrentWallet();
        console.log(this.wallets);
        console.log('this.currentWalletIndex=' + this.currentWalletIndex);
        if (this.currentWalletIndex >= 0 && this.wallets) {
            
            this.wallets.splice(this.currentWalletIndex, 1);
        }
        console.log(this.wallets);
        if (this.wallets.length === this.currentWalletIndex) {
            this.currentWalletIndex = this.wallets.length - 1;
            await this.walletServ.saveCurrentWalletIndex(this.currentWalletIndex);
        }
        this.walletServ.updateWallets(this.wallets);    
        
    }

    async loadCoinsPrice() {
        this.coinsPrice = await this.apiServ.getCoinsPrice();
    }
    async loadBalance() {
        
        //console.log('this.coinsPrice=');
        //console.log(this.coinsPrice);
        if (!this.wallet) {
            return;
        }
        
        let updated = false;
        for ( let i = 0; i < this.wallet.mycoins.length; i++ ) {
            const coin = this.wallet.mycoins[i];
            const balance = await this.coinServ.getBalance(coin);
            if (coin.balance !== balance.balance || coin.lockedBalance !== balance.lockbalance) {                        /*
                this.wallets = new Array<Wallet>();
                wallets.forEach(wl => { this.wallets.push(wl); });
                */
                coin.balance = balance.balance;
                coin.lockedBalance = balance.lockbalance;
                updated = true;
            }
        }
        if (updated) {
            console.log('updated=' + updated);
            this.walletServ.updateToWalletList(this.wallet, this.currentWalletIndex);
        }
    }
    startTimer() {
        setInterval(() => {
            this.loadBalance();

        },5000)
    }

    async changeWallet(value) {
        this.currentWalletIndex = value;
        //this.wallet = this.wallets[this.currentWalletIndex];
        //this.exgAddress = this.wallet.mycoins[0].receiveAdds[0].address;
        this.walletServ.saveCurrentWalletIndex(this.currentWalletIndex);
        console.log('this.currentWalletIndex=' + this.currentWalletIndex);
        await this.loadWallet(this.wallets[this.currentWalletIndex]);
    }
    
    async loadWallets() {
        this.wallets = await this.walletServ.getWallets();
        if (!this.wallets) {
            this.route.navigate(['/wallet/create']);
            return;
        }
        this.currentWalletIndex = await this.walletServ.getCurrentWalletIndex();
    }
    async loadWallet(wallet: Wallet) {
        this.wallet = wallet;
        console.log('this.wallet=', this.wallet);
        this.exgAddress = this.wallet.mycoins[0].receiveAdds[0].address;
        this.exgBalance = this.wallet.mycoins[0].balance;
        console.log('load wallet again.');
        this.kanbanServ.getKanbanBalance(this.wallet.excoin.receiveAdds[0].address).subscribe(
            (resp: any) => {
                console.log('resp=',resp);
                this.gas = Number(BigInt(resp.balance.FAB).toString(10)) / 1e18;
                console.log(this.gas);
            }
        );        

    }
    exchangeMoney() {
        this.route.navigate(['/market/home']);
    }
    openModal(template: TemplateRef<any>) {
        this.modalRef = this.modalServ.show(template);
    } 

    
    addGasFee() {
        //this.currentCoin = this.wallet.mycoins[1];
        this.addGasModal.show();
    }
    
    withdraw(currentCoin: MyCoin) {
        this.currentCoin = currentCoin;
        this.withdrawModal.show();        
    }

    deposit(currentCoin: MyCoin) {
        this.currentCoin = currentCoin;
        this.depositModal.show();
        /*
        this.amount = 0.2;
        this.pin = '1qaz@WSX';
        this.depositdo();
        */ 
    }

    onConfirmedDepositAmount(amount: number) {
        this.amount = amount;
        this.opType = 'deposit';
        this.pinModal.show();
    }

    onConfirmedWithdrawAmount(amount: number) {
        this.amount = amount;
        this.opType = 'withdraw';
        this.pinModal.show();
    }

    onConfirmedLoginSetting(password: string) {
        console.log('new password=' + password);
        this.wallet = this.walletServ.updateWalletPassword(this.wallet, this.pin, password);
        this.walletServ.updateToWalletList(this.wallet, this.currentWalletIndex);
    }

    onConfirmedGas(amount: number) {
        this.amount = amount;
        this.opType = 'addGas';
        this.pinModal.show();        
    }

    onConfirmedCoinSent(sendCoinForm: SendCoinForm) {
        this.sendCoinForm = sendCoinForm;
        this.opType = 'sendCoin';
        this.pinModal.show();
    }

    addAssets() {
        this.addAssetsModal.show();
    }

    sendCoin() {
        this.sendCoinModal.show();
    }

    onConfirmedPin(pin: string) {
        console.log('pin is:' + pin);
        this.pin = pin;
        const pinHash = this.utilService.SHA256(pin).toString();
        if (pinHash !== this.wallet.pwdHash) {
            this._snackBar.open('Your pin number is invalid.', 'Ok', {
                duration: 2000,
            });
            return;
        }
        if (this.opType === 'deposit') {
            this.depositdo();
        } else 
        if (this.opType === 'withdraw') {
            this.withdrawdo();
        } else
        if (this.opType === 'addGas') {
            this.addGasDo();
        } else
        if (this.opType === 'sendCoin') {
            this.sendCoinDo();
        } else 
        if (this.opType === 'showSeedPhrase') {
            this.showSeedPhrase();
        } else
        if (this.opType === 'verifySeedPhrase') {
            this.verifySeedPhrase();
        } else 
        if (this.opType === 'backupPrivateKey') {
            this.backupPrivateKey();
        } else 
        if (this.opType === 'deleteWallet') {
            this.deleteWalletModal.show();
        } else 
        if (this.opType === 'loginSetting') {
            this.loginSettingModal.show();
        }
    }

    showSeedPhrase() {
        let seedPhrase = '';
        if (this.wallet.encryptedMnemonic) {
            seedPhrase = this.utilServ.aesDecrypt(this.wallet.encryptedMnemonic, this.pin);
        }
        if (seedPhrase) {
            this.showSeedPhraseModal.show(seedPhrase);
        } else {
            this._snackBar.open('Your pin number is invalid.', 'Ok', {
                duration: 2000,
            });
        }
    }

    backupPrivateKey() {
        const seed = this.utilServ.aesDecryptSeed(this.wallet.encryptedSeed, this.pin);
        this.seed = seed;
        if (!seed) {
            this._snackBar.open('Your pin number is invalid.', 'Ok', {
                duration: 2000,
            });        
            return;   
        } 
        this.backupPrivateKeyModal.show(seed, this.wallet);
    }

    verifySeedPhrase() {
        let seedPhrase = '';
        if (this.wallet.encryptedMnemonic) {
            seedPhrase = this.utilServ.aesDecrypt(this.wallet.encryptedMnemonic, this.pin);
        }

        if (seedPhrase) {
            this.verifySeedPhraseModal.show(seedPhrase);
        } else {
            this._snackBar.open('Your pin number is invalid.', 'Ok', {
                duration: 2000,
            });
        }        
        
    }

    onConfirmedAssets(assets: [Token]) {
        for (let i = 0; i < assets.length; i++) {
            const token = assets[i];
            const type = token.type;
            const name = token.name;
            const addr = token.address;
            const decimals = token.decimals;
            for (let j = 0; j < 5 ; j ++) {
                if (this.wallet.mycoins[j].name === type) {
                    const baseCoin = this.wallet.mycoins[j];
                    const mytoken = this.coinServ.initToken(type, name, decimals, addr, baseCoin);
                    this.wallet.mycoins.push(mytoken);
                    break;
                }
            }

        }
    }

    async depositFab(currentCoin) {
        const amount = this.amount;
        const pin = this.pin;     
        
        const seed = this.utilServ.aesDecryptSeed(this.wallet.encryptedSeed, pin);
        if (!seed) {
            this._snackBar.open('Your pin number is invalid.', 'Ok', {
                duration: 2000,
            });        
            return;   
        } 
        const scarAddress = await this.kanbanServ.getScarAddress();
        console.log('scarAddress=', scarAddress);
        this.coinServ.depositFab(scarAddress, seed, currentCoin, amount);

    }

    async addGasDo() {
        const currentCoin = this.wallet.mycoins[1];
        this.depositFab(currentCoin);        
    }
    async sendCoinDo() {
        const pin = this.pin;
        const currentCoin = this.wallet.mycoins[this.sendCoinForm.coinIndex];

        const seed = this.utilService.aesDecryptSeed(this.wallet.encryptedSeed, pin);

        const amount = this.sendCoinForm.amount;
        const doSubmit = true;
        const options = {
            gasPrice: this.sendCoinForm.gasPrice,
            gasLimit: this.sendCoinForm.gasLimit,
            satoshisPerByte: this.sendCoinForm.satoshisPerByte
        };
        const {txHex, txHash} = await this.coinService.sendTransaction(currentCoin, seed, 
            this.sendCoinForm.to, amount, options, doSubmit
        );
        if (txHex) {
            const today = new Date();
            const item = {
                type: 'Send',
                coin: currentCoin.name,
                tokenType: currentCoin.tokenType,
                amount: amount,
                txid: txHash,
                time: today,
                confirmations: '0',
                blockhash: '', 
                comment: this.sendCoinForm.comment
            };
            this.storageService.storeToTransactionHistoryList(item);
        }
    }

    async withdrawdo() {
        const currentCoin = this.currentCoin;

        const amount = this.amount;
        const pin = this.pin;

        const coinType = this.coinServ.getCoinTypeIdByName(currentCoin.name);

        const seed = this.utilServ.aesDecryptSeed(this.wallet.encryptedSeed, pin);
        if (!seed) {
            this._snackBar.open('Your pin number is invalid.', 'Ok', {
                duration: 2000,
            });        
            return;   
        }         
        const keyPairsKanban = this.coinServ.getKeyPairs(this.wallet.excoin, seed, 0, 0);   
        const amountInLink = amount * 1e18; // it's for all coins.
        const addressInWallet = currentCoin.receiveAdds[0].address;
        const abiHex = this.web3Serv.getWithdrawFuncABI(coinType, amountInLink, addressInWallet);  
        const coinPoolAddress = await this.kanbanServ.getCoinPoolAddress();
        const includeCoin = true;
        const nonce = await this.kanbanServ.getTransactionCount(keyPairsKanban.address);
        const txKanbanHex = await this.web3Serv.signAbiHexWithPrivateKey(abiHex, keyPairsKanban, coinPoolAddress, nonce, includeCoin); 

        this.kanbanServ.sendRawSignedTransaction(txKanbanHex).subscribe((resp) => { 
            console.log('resp=', resp);
        });      
    }

    async depositdo() {

        const currentCoin = this.currentCoin;

        const amount = this.amount;
        const pin = this.pin;

        const coinType = this.coinServ.getCoinTypeIdByName(currentCoin.name);

        const seed = this.utilServ.aesDecryptSeed(this.wallet.encryptedSeed, pin);
        if (!seed) {
            this._snackBar.open('Your pin number is invalid.', 'Ok', {
                duration: 2000,
            });        
            return;   
        }         
        const keyPairs = this.coinServ.getKeyPairs(currentCoin, seed, 0, 0);


        const officalAddress = this.coinServ.getOfficialAddress(currentCoin);
        const addressInKanban = this.wallet.excoin.receiveAdds[0].address;

        const keyPairsKanban = this.coinServ.getKeyPairs(this.wallet.excoin, seed, 0, 0);

        console.log('addressInKanban=', addressInKanban);
        console.log('keyPairsKanban.address=', keyPairsKanban.address);
        const doSubmit = false;
        const options = {};
        const {txHex, txHash} = await this.coinServ.sendTransaction(currentCoin, seed, officalAddress, amount, options, doSubmit);   
        //const txSubmited = await this.coinServ.sendTransaction(currentCoin, seed, officalAddress, amount, true);   
        console.log('111111111111111111111111111111111111111111111111111111111111');
        console.log('txHex=' + txHex);
        console.log('txHash=' + txHash);
        //console.log('txSubmited.txHex=' , txSubmited.txHex) ;
        //console.log('txSubmited.txHash=' , txSubmited.txHash);
        if (!txHash) {
            this._snackBar.open('Not enough fund.', 'Ok', {
                duration: 2000,
            });              
            return;
        }


        const amountInLink = amount * 1e18; // it's for all coins.
        const originalMessage = this.coinServ.getOriginalMessage(coinType, txHash.substring(2), amountInLink, addressInKanban.substring(2));
        //console.log('a');
        const signedMessage: Signature = this.coinServ.signedMessage(originalMessage, keyPairs);
        //console.log('b');
        const coinPoolAddress = await this.kanbanServ.getCoinPoolAddress();
        //console.log('c');
        const abiHex = this.web3Serv.getDepositFuncABI(coinType, txHash, amountInLink, addressInKanban, signedMessage);
        //console.log('d');
        const nonce = await this.kanbanServ.getTransactionCount(addressInKanban);
        //const nonce = 0;
        const includeCoin = true;
        //console.log('e');
        console.log('private key for kanban=', keyPairsKanban.privateKeyHex);
        const txKanbanHex = await this.web3Serv.signAbiHexWithPrivateKey(abiHex, keyPairsKanban, coinPoolAddress, nonce, includeCoin); 
        //console.log('f');
        
        /*
        this.kanbanServ.sendRawSignedTransaction(txKanbanHex).subscribe((resp) => { 
            console.log('resp=' + resp);
        });         
        */
       
       
       this.kanbanServ.submitDeposit(txHex, txKanbanHex).subscribe((resp) => { 
            console.log('resp=', resp);
        }); 
         
    }
}
