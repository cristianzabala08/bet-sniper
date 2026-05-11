import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BlockchainService } from '../wallets/blockchain.service';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import ABI_SWAP_GNS from '../wallets/abis/SwapGNS.json';
import USDTABI from '../wallets/abis/usdt.abi.json';

async function bootstrap() {
  console.log('🚀 Iniciando script de prueba triggerSistemFunds...');

  const appContext = await NestFactory.createApplicationContext(AppModule);

  try {
    const blockchainService = appContext.get(BlockchainService);
    const configService = appContext.get(ConfigService);

    // Configuración manual para diagnóstico (usando las mismas variables que el servicio)
    const rpc = configService.get<string>('BLOCKCHAIN_RPC');
    const web3 = new Web3(rpc);
    const adminKey = configService.get<string>('ADMIN_PRIVATE_KEY') || '';
    const account = web3.eth.accounts.privateKeyToAccount(
      adminKey.startsWith('0x') ? adminKey : `0x${adminKey}`,
    );
    const swapContractAddress = configService.get<string>(
      'SWAP_CONTRACT_ADDRESS',
    );

    // USDT Address (lo sacamos del contrato SwapGNS o hardcoded si es BSC Mainnet)
    // En el código del usuario se ve que el contrato tiene una variable pública 'USDT'.
    const swapContract = new web3.eth.Contract(
      ABI_SWAP_GNS as any,
      swapContractAddress,
    );
    const usdtAddress = await swapContract.methods.USDT().call();

    console.log(`\n--- 🕵️‍♂️ DIAGNÓSTICO PREVIO ---`);
    console.log(`Admin (Caller): ${account.address}`);
    console.log(`Swap Contract: ${swapContractAddress}`);
    console.log(`USDT Token: ${usdtAddress}`);

    // 1. Verificar si es Admin
    const isAdmin = await swapContract.methods.admins(account.address).call();
    console.log(`¿Es Admin? ${isAdmin ? '✅ SÍ' : '❌ NO'}`);

    // 2. Verificar balance USDT del contrato SwapGNS
    const usdtContract = new web3.eth.Contract(
      USDTABI as any,
      usdtAddress as unknown as string,
    );
    const contractBalanceWei = await usdtContract.methods
      .balanceOf(swapContractAddress)
      .call();
    const contractBalanceEth = web3.utils.fromWei(
      contractBalanceWei as unknown as string,
      'ether',
    );

    console.log(`Balance USDT del contrato SwapGNS: ${contractBalanceEth}`);

    const amount = 5;
    const isFirstPurchase = true;

    console.log(`\n--- 🧪 INTENTANDO EJECUCIÓN (${amount} USDT) ---`);

    if (Number(contractBalanceEth) < amount) {
      console.warn(
        `⚠️ ALERTA: El contrato tiene MÁS BAJO balance (${contractBalanceEth}) que el monto a repartir (${amount}). Es probable que falle.`,
      );
    }

    const result = await blockchainService.triggerSistemFunds(
      amount,
      isFirstPurchase,
    );

    if (result.success) {
      console.log(`✅ Resultado: EXITOSO`);
      console.log(`🔗 Hash de transacción: ${result.txHash}`);
    } else {
      console.log(`❌ Resultado: FALLIDO`);
    }
  } catch (error) {
    console.error('❌ Error ejecutando el script de prueba:', error);
  } finally {
    await appContext.close();
    console.log('🏁 Proceso de prueba finalizado.');
    process.exit(0);
  }
}

bootstrap();
