import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Web3 from 'web3';
// Importamos el tipo EventLog para el tipado correcto
import { EventLog } from 'web3-eth-contract';
import { ConfigService } from '@nestjs/config';
import ABI_XWIN_PURCHASE from './abis/ABI_XWIN_PURCHASE.json';
import ABI_XWIN_PURCHASE_SIGNAL from './abis/siganlContract.json';
import ABI_SWAP_GNS from './abis/SwapGNS.json';
import USDTABI from './abis/usdt.abi.json';

const logger = new Logger('BlockchainService');

@Injectable()
export class BlockchainService {
  private web3: Web3;
  private contractAddress: string;
  private SWAP_CONTRACT_ADDRESS: string;
  private ADMIN_PRIVATE_KEY: string;
  private PRIVATEKEY: string;
  private SIGNAL_CONTRACT_ADDRESS: string;

  constructor(private configService: ConfigService) {
     const rpcUrl =
      this.configService.get<string>('BLOCKCHAIN_RPC') ||
      process.env.BLOCKCHAIN_RPC ||
      'https://burned-hardworking-county.bsc.quiknode.pro/163c400122d41c7e7776e290321f9c8e4e1da32b';

    if (!rpcUrl) {
      logger.error('❌ BLOCKCHAIN_RPC is not defined in environment variables');
    }

    this.web3 = new Web3(rpcUrl);

    this.contractAddress = '0xb0D52740Afc02c611120803442383cafD80F4D1e';
    // this.configService.get<string>('PURCHASE_CONTRACT_ADDRESS') || '';
    this.SWAP_CONTRACT_ADDRESS =
      this.configService.get<string>('SWAP_CONTRACT_ADDRESS') || '';
    this.ADMIN_PRIVATE_KEY =
      this.configService.get<string>('ADMIN_PRIVATE_KEY') || '';
    this.PRIVATEKEY = this.configService.get<string>('PRIVATE') || '';
    this.SIGNAL_CONTRACT_ADDRESS = '0x5aa9fee1ba774e8be7ee28c5d4e626df531dbd34';
  }

  /**
   * Ejecuta la repartición de fondos en el contrato SwapGNS
   * @param amount El monto que entró (en formato humano, ej. 99)
   * @param isUsdt Booleano para indicar si es USDT
   */
  async triggerSistemFunds(
    amount: number,
    isFirstPurchase: boolean, // <--- NUEVO PARÁMETRO
  ): Promise<{ txHash: string | null; success: boolean }> {
    try {
      logger.log(
        `[triggerSistemFunds] 🚀 Iniciando repartición de fondos: monto=${amount}, isFirstPurchase=${isFirstPurchase}`,
      );

      const rawKey = this.ADMIN_PRIVATE_KEY.trim();
      if (!rawKey) throw new Error('ADMIN_PRIVATE_KEY is empty');

      const cleanKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
      const account = this.web3.eth.accounts.privateKeyToAccount(cleanKey);
      logger.log(
        `[triggerSistemFunds] 🔑 Cuenta administrativa: ${account.address}`,
      );

      const contract = new this.web3.eth.Contract(
        ABI_SWAP_GNS as any,
        this.SWAP_CONTRACT_ADDRESS,
      ) as any;
      logger.log(
        `[triggerSistemFunds] 📄 Contrato SwapGNS: ${this.SWAP_CONTRACT_ADDRESS}`,
      );

      // Convertimos el monto a Wei (18 decimales para USDT en este caso)
      const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      logger.log(`[triggerSistemFunds] 💰 Monto en Wei: ${amountInWei}`);

      const query = contract.methods.sistemFunds(amountInWei, isFirstPurchase);

      logger.log('[triggerSistemFunds] 🛠️ Consultando precio de gas...');
      const gasPrice = await this.web3.eth.getGasPrice();
      logger.log(`[triggerSistemFunds] ⛽ Gas Price: ${gasPrice}`);

      let gas;
      try {
        logger.log(
          '[triggerSistemFunds] 📉 Estimando gas para la transacción...',
        );
        gas = await query.estimateGas({ from: account.address });
        logger.log(`[triggerSistemFunds] ✅ Gas estimado: ${gas}`);
      } catch (e) {
        logger.error(
          `[triggerSistemFunds] ❌ Error estimando gas: ${e.message}`,
        );
        throw new Error(`GAS_ESTIMATION_FAILED: ${e.message}`);
      }

      const txOptions = {
        from: account.address,
        to: this.SWAP_CONTRACT_ADDRESS,
        data: query.encodeABI(),
        gas: Math.floor(Number(gas) * 1.2),
        gasPrice: gasPrice,
      };

      logger.log('[triggerSistemFunds] ✍️ Firmando transacción...');
      const signedTx = await account.signTransaction(txOptions);

      logger.log(
        '[triggerSistemFunds] 📨 Enviando transacción firmada a la red...',
      );
      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction as any,
      );

      logger.log(
        `[triggerSistemFunds] ✅ Transacción confirmada: ${receipt.transactionHash}`,
      );
      return { txHash: receipt.transactionHash.toString(), success: true };
    } catch (error) {
      logger.error(
        `[triggerSistemFunds] ❌ Falló la ejecución: ${error.message}`,
      );
      return { txHash: null, success: false };
    }
  }

  async verifyPurchaseEvent(txHash: string, expectedUserId: string) {
    logger.log(
      `[verifyPurchaseEvent] Starting verification for TX: ${txHash}, Expected User: ${expectedUserId}`,
    );

    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);

      if (!receipt) {
        logger.error(
          `[verifyPurchaseEvent] ❌ Receipt NOT found for TX: ${txHash}. Possible Network Mismatch? RPC: ${this.web3.provider}`,
        );
        throw new BadRequestException('Transaction not found on this chain');
      }

      logger.log(
        `[verifyPurchaseEvent] ✅ Receipt found. Block: ${receipt.blockNumber}, Status: ${receipt.status}`,
      );

      const contract = new this.web3.eth.Contract(
        ABI_XWIN_PURCHASE,
        this.contractAddress,
      ) as any;

      // Obtenemos los eventos del bloque de la transacción
      logger.log(
        `[verifyPurchaseEvent] Fetching 'PackPurchased' events from block ${receipt.blockNumber}...`,
      );
      // Obtenemos los eventos del bloque de la transacción
      logger.log(
        `[verifyPurchaseEvent] Fetching 'PackPurchased' events from block ${receipt.blockNumber}...`,
      );

      let logs: (string | EventLog)[] = [];
      const maxRetries = 5;
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      for (let i = 0; i < maxRetries; i++) {
        try {
          logs = await contract.getPastEvents('PackPurchased', {
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          });
          if (logs) break;
        } catch (err) {
          logger.warn(
            `[verifyPurchaseEvent] ⚠️ RPC Error (Attempt ${i + 1}/${maxRetries}): ${err.message}. Retrying in 2s...`,
          );
          if (i === maxRetries - 1) throw err; // Si es el último intento, lanzar error
          await delay(2000); // Esperar 2 segundos antes de reintentar
        }
      }

      logger.log(`[verifyPurchaseEvent] Found ${logs.length} events in block.`);

      // SOLUCIÓN AL ERROR DE TS: Usamos un Type Guard para asegurar que 'e' es un EventLog
      const event = logs.find(
        (e: any): e is EventLog =>
          typeof e !== 'string' &&
          e.transactionHash.toLowerCase() === txHash.toLowerCase(),
      );

      if (!event) {
        logger.error(
          `[verifyPurchaseEvent] ❌ User event NOT found in logs. Available Logs Hashes: ${logs.map((l: any) => l.transactionHash).join(', ')}`,
        );
        throw new BadRequestException('Invalid event logs or event not found');
      }

      logger.log(`[verifyPurchaseEvent] ✅ Event MATCHED for TX ${txHash}`);

      // Extraemos los valores. En Web3 v4, returnValues es un objeto indexado.
      const { userId, planId, amount } = event.returnValues as any;

      logger.log(
        `[verifyPurchaseEvent] Event Data -> UserId: ${userId}, PlanId: ${planId}, Amount(Wei): ${amount}`,
      );

      // VALIDACIÓN DE SEGURIDAD
      if (String(userId) !== String(expectedUserId)) {
        logger.warn(
          `[verifyPurchaseEvent] ⚠️ User ID Mismatch! Event User: ${userId}, Expected: ${expectedUserId}`,
        );
        throw new BadRequestException('User ID mismatch');
      }

      /**
       * MANEJO DE DECIMALES:
       * Si es USDT en BSC/Ethereum, normalmente son 6 decimales ('mwei').
       * Si tu contrato usa 18 decimales (estándar ERC20), usa 'ether'.
       */
      const amountInWei = amount.toString();
      const humanAmount = parseFloat(
        this.web3.utils.fromWei(amountInWei, 'ether'),
      ); // Cambiar a 'mwei' si USDT es 6 dec.

      logger.log(
        `[verifyPurchaseEvent] returning parsed data: Amount=${humanAmount}`,
      );

      return {
        planId: Number(planId),
        amount: humanAmount,
        buyer: event.returnValues.buyer as string,
        txHash: event.transactionHash,
      };
    } catch (error) {
      // Imprime el código de error específico si existe
      logger.error(
        `[verifyPurchaseEvent] ❌ RPC Error: Status ${error.statusCode} - Code ${error.code}`,
      );
      logger.error(
        `[verifyPurchaseEvent] Details: ${JSON.stringify(error, null, 2)}`,
      );
      throw error;
    }
  }

  async verifyPurchaseEventSignal(txHash: string, expectedUserId: string) {
    logger.log(
      `[verifyPurchaseEvent] Starting verification for TX: ${txHash}, Expected User: ${expectedUserId}`,
    );

    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);

      if (!receipt) {
        logger.error(
          `[verifyPurchaseEvent] ❌ Receipt NOT found for TX: ${txHash}. Possible Network Mismatch? RPC: ${this.web3.provider}`,
        );
        throw new BadRequestException('Transaction not found on this chain');
      }

      logger.log(
        `[verifyPurchaseEvent] ✅ Receipt found. Block: ${receipt.blockNumber}, Status: ${receipt.status}`,
      );

      const contract = new this.web3.eth.Contract(
        ABI_XWIN_PURCHASE_SIGNAL,
        this.SIGNAL_CONTRACT_ADDRESS,
      ) as any;

      // Obtenemos los eventos del bloque de la transacción
      logger.log(
        `[verifyPurchaseEvent] Fetching 'PackPurchased' events from block ${receipt.blockNumber}...`,
      );
      // Obtenemos los eventos del bloque de la transacción
      logger.log(
        `[verifyPurchaseEvent] Fetching 'PackPurchased' events from block ${receipt.blockNumber}...`,
      );

      let logs: (string | EventLog)[] = [];
      const maxRetries = 5;
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      for (let i = 0; i < maxRetries; i++) {
        try {
          logs = await contract.getPastEvents('PackPurchased', {
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          });
          if (logs) break;
        } catch (err) {
          logger.warn(
            `[verifyPurchaseEvent] ⚠️ RPC Error (Attempt ${i + 1}/${maxRetries}): ${err.message}. Retrying in 2s...`,
          );
          if (i === maxRetries - 1) throw err; // Si es el último intento, lanzar error
          await delay(2000); // Esperar 2 segundos antes de reintentar
        }
      }

      logger.log(`[verifyPurchaseEvent] Found ${logs.length} events in block.`);

      // SOLUCIÓN AL ERROR DE TS: Usamos un Type Guard para asegurar que 'e' es un EventLog
      const event = logs.find(
        (e: any): e is EventLog =>
          typeof e !== 'string' &&
          e.transactionHash.toLowerCase() === txHash.toLowerCase(),
      );

      if (!event) {
        logger.error(
          `[verifyPurchaseEvent] ❌ User event NOT found in logs. Available Logs Hashes: ${logs.map((l: any) => l.transactionHash).join(', ')}`,
        );
        throw new BadRequestException('Invalid event logs or event not found');
      }

      logger.log(`[verifyPurchaseEvent] ✅ Event MATCHED for TX ${txHash}`);

      // Extraemos los valores. En Web3 v4, returnValues es un objeto indexado.
      const { userId, planId, usdtAmount, aigAmount } =
        event.returnValues as any;

      logger.log(
        `[verifyPurchaseEvent] Event Data -> UserId: ${userId}, PlanId: ${planId}, Amount(Wei): ${usdtAmount}, AIG Amount: ${aigAmount}`,
      );

      // VALIDACIÓN DE SEGURIDAD
      if (String(userId) !== String(expectedUserId)) {
        logger.warn(
          `[verifyPurchaseEvent] ⚠️ User ID Mismatch! Event User: ${userId}, Expected: ${expectedUserId}`,
        );
        throw new BadRequestException('User ID mismatch');
      }

      /**
       * MANEJO DE DECIMALES:
       * Si es USDT en BSC/Ethereum, normalmente son 6 decimales ('mwei').
       * Si tu contrato usa 18 decimales (estándar ERC20), usa 'ether'.
       */
      const amountInWei = usdtAmount.toString();
      const aigAmountInWei = aigAmount.toString();
      const humanAmount = parseFloat(
        this.web3.utils.fromWei(amountInWei, 'ether'),
      ); // Cambiar a 'mwei' si USDT es 6 dec.
      const humanAigAmount = parseFloat(
        this.web3.utils.fromWei(aigAmountInWei, 'ether'),
      ); // Cambiar a 'mwei' si USDT es 6 dec.

      logger.log(
        `[verifyPurchaseEvent] returning parsed data: Amount=${humanAmount}`,
      );

      return {
        planId: Number(planId),
        amount: humanAmount,
        aigAmount: humanAigAmount,
        buyer: event.returnValues.buyer as string,
        txHash: event.transactionHash,
      };
    } catch (error) {
      // Imprime el código de error específico si existe
      logger.error(
        `[verifyPurchaseEvent] ❌ RPC Error: Status ${error.statusCode} - Code ${error.code}`,
      );
      logger.error(
        `[verifyPurchaseEvent] Details: ${JSON.stringify(error, null, 2)}`,
      );
      throw error;
    }
  }

  async sendUSDT(
    to: string,
    amount: number,
  ): Promise<{ tx: string; error: boolean; receipt: any }> {
    logger.log(`[sendUSDT] Initiating transfer. To: ${to}, Amount: ${amount}`);

    try {
      if (!this.PRIVATEKEY) throw new Error('PRIVATEKEY is missing');

      const account = this.web3.eth.accounts.privateKeyToAccount(
        this.PRIVATEKEY.startsWith('0x')
          ? this.PRIVATEKEY
          : `0x${this.PRIVATEKEY}`,
      );

      // USDT Contract Address (BSC Mainnet)
      const usdtContractAddress = '0x55d398326f99059fF775485246999027B3197955';

      const usdtContract = new this.web3.eth.Contract(
        USDTABI as any,
        usdtContractAddress,
      );

      // Convert amount to 18 decimals (ether)
      // Note: User snippet said 'ether' (18 decimals).
      const amountInWei = this.web3.utils.toWei(amount.toString(), 'ether');
      logger.log(`[sendUSDT] Amount (Wei): ${amountInWei}`);

      // Check Balance
      const rawBalance = await usdtContract.methods
        .balanceOf(account.address)
        .call();
      const balanceInUSDT = parseFloat(
        this.web3.utils.fromWei(rawBalance as any, 'ether'),
      );
      logger.log(`[sendUSDT] Sender Balance: ${balanceInUSDT} USDT`);

      if (balanceInUSDT < amount) {
        const errorMsg = `❌ Insufficient Balance. Has: ${balanceInUSDT}, Needs: ${amount}`;
        logger.error(errorMsg);
        return { error: true, tx: '', receipt: errorMsg };
      }

      // Transfer data
      const data = usdtContract.methods.transfer(to, amountInWei).encodeABI();

      // Gas and Nonce
      const nonce = await this.web3.eth.getTransactionCount(
        account.address,
        'latest',
      );
      const gasLimit = await usdtContract.methods
        .transfer(to, amountInWei)
        .estimateGas({ from: account.address });

      // Tx setup
      const tx = {
        to: usdtContractAddress,
        data,
        gas: Math.ceil(Number(gasLimit) * 1.2), // 20% buffer
        gasPrice: await this.web3.eth.getGasPrice(), // Use current gas price
        nonce,
        // chainId: 56, // BSC Mainnet. Web3 usually handles this if provider is set correctly.
      };

      const signedTx = await account.signTransaction(tx);
      const receipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction as string,
      );

      logger.log(
        `[sendUSDT] ✅ Transfer Successful. TX: ${receipt.transactionHash}`,
      );
      return {
        tx: receipt.transactionHash.toString(),
        error: false,
        receipt,
      };
    } catch (error) {
      logger.error(`[sendUSDT] ❌ Error: ${error.message}`);
      return { error: true, tx: '', receipt: error.message };
    }
  }
}
