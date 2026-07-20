import { Injectable, signal, inject } from '@angular/core';
import { UserService } from './user.service';
import { createAppKit } from '@reown/appkit';
import { mainnet, bsc } from '@reown/appkit/networks';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import ERC20_ABI from '../../../abis/erc20.json';
import ABI_XWIN_PURCHASE from '../../../abis/ABI_XWIN_PURCHASE.json';
import { ToastService } from './toast.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';

@Injectable({ providedIn: 'root' })
export class Web3Service {
  private modal: any;
  // Usamos Signals de Angular para que la UI reaccione instantáneamente
  public address = signal<string | null>(null);
  public isConnected = signal<boolean>(false);

  // Default USDT Address (BSC Mainnet)
  private readonly defaultTokenAddress =
    '0x55d398326f99059ff775485246999027b3197955';

  // --- PASARELA METHODS ---
  public readonly PASARELA_ADDRESS =
    '0x0F1247D4394145b08f819D8184D71595622f8470'; // TODO: Replace with real address

  private userService = inject(UserService);
  private toast: ToastService = inject(ToastService);
  private tokenService = inject(TokenService);

  constructor() {
    this.initModal();
  }

  private initModal() {
    const projectId = '2054c581e4b33c32aacdd51daedd014d'; // TODO: Update with real Project ID

    this.modal = createAppKit({
      adapters: [new EthersAdapter()],
      // 2. Agregar bscTestnet al array de redes
      networks: [bsc, mainnet],
      metadata: {
        name: 'Bet Sniper',
        description: 'Bet Sniper PWA Application',
        url: 'https://betsniper.com',
        icons: ['https://avatars.mywebsite.com/'],
      },
      projectId,
      features: {
        analytics: true,
        // Opcional: puedes forzar a que la Testnet sea la red por defecto durante tus pruebas
        email: false, // Desactiva login social si no lo usas
        socials: [],
      },
    });
    // Escuchar cambios de cuenta de forma nativa
    this.modal.subscribeAccount((state: any) => {
      const addr = state.address || null;
      this.address.set(addr);
      this.isConnected.set(state.isConnected);

      if (state.isConnected && addr) {
        // Optimization: Check if the connected wallet matches the one in the token
        const payload = this.tokenService.getPayload();
        const storedWallet = payload?.wallet;

        // Use lowercase for case-insensitive comparison
        const isSameWallet = storedWallet?.toLowerCase() === addr.toLowerCase();

        if (!isSameWallet) {
          this.userService.updateWallet(addr).subscribe({
            next: (res: any) => {
              // El backend re-firma el JWT con la wallet nueva: sin guardar
              // este token, el resto de la sesión (p.ej. /gpulse-sso) sigue
              // viendo al usuario como "sin wallet" hasta el próximo login.
              const newToken = res?.token;
              if (newToken) this.tokenService.saveToken(newToken);
            },
            error: (err) => console.error('Error syncing wallet', err),
          });
        } else {
        }
      }
    });
  }

  async connectWallet() {
    await this.modal.open();
  }

  async disconnectWallet() {
    await this.modal.disconnect();
  }

  private async getValidSigner() {
    const walletProvider = this.modal.getWalletProvider();
    if (!walletProvider) throw new Error('Wallet no conectada');
    const provider = new BrowserProvider(walletProvider);
    return await provider.getSigner();
  }

  private async getProvider() {
    const walletProvider = this.modal.getWalletProvider();
    if (!walletProvider) {
      // Si no hay wallet conectada, tal vez deberíamos usar un RPC público para lectura
      // Pero por ahora lanzamos error o retornamos null
      throw new Error('WalletProvider not available');
    }
    return new BrowserProvider(walletProvider);
  }

  // --- TOKEN METHODS ---

  async getUSDTBalance(
    tokenAddress: string = this.defaultTokenAddress,
  ): Promise<string> {
    const provider = await this.getProvider();

    // VALIDACIÓN: Verificar si hay código en esa dirección antes de llamar
    const code = await provider.getCode(tokenAddress);
    if (code === '0x' || code === '0x0') {
      throw new Error(
        `El contrato no existe en la dirección: ${tokenAddress}. ¿Estás en la red correcta (BSC Testnet)?`,
      );
    }

    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    try {
      const decimals = await contract['decimals']();
      const balance = await contract['balanceOf'](this.address());
      return formatUnits(balance, decimals);
    } catch (err) {
      console.error(
        'Error al decodificar: asegúrate de que el ABI sea el correcto',
        err,
      );
      return '0';
    }
  }

  async checkAllowance(
    spenderAddress: string,
    tokenAddress: string = this.defaultTokenAddress,
  ): Promise<string> {
    const provider = await this.getProvider(); // Read-only is fine for allowance
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    // We need the signer address to check allowance OF the user
    // But checkAllowance is usually read-only.
    // Use this.address() signal.
    const userAddress = this.address();
    if (!userAddress) return '0';

    try {
      const decimals = await contract['decimals']();
      const allowance = await contract['allowance'](
        userAddress,
        spenderAddress,
      );
      return formatUnits(allowance, decimals);
    } catch (err) {
      console.error('Error checking allowance:', err);
      return '0';
    }
  }

  /**
   * Approve a spender (contract) to spend tokens
   * @param spenderAddress The address of the contract to approve
   * @param amount The amount to approve (readable string, e.g., "100.50")
   * @param tokenAddress Token contract address
   */
  async approveToken(
    spenderAddress: string,
    amount: string,
    tokenAddress: string = this.defaultTokenAddress,
  ): Promise<any> {
    const signer = await this.getValidSigner();

    const contract = new Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await contract['decimals']();
    const amountInWei = parseUnits(amount, decimals);

    const tx = await contract['approve'](spenderAddress, amountInWei);
    return tx.wait(); // Wait for transaction to be mined
  }

  /**
   * Transfer tokens directly
   */
  async transferToken(
    toAddress: string,
    amount: string,
    tokenAddress: string = this.defaultTokenAddress,
  ): Promise<any> {
    const signer = await this.getValidSigner();

    const contract = new Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await contract['decimals']();
    const amountInWei = parseUnits(amount, decimals);

    const tx = await contract['transfer'](toAddress, amountInWei);
    return tx.wait();
  }

  async buyPlan(tier: number, priceUSDT: string, userId: string): Promise<any> {
    const signer = await this.getValidSigner();

    const usdtContract = new Contract(
      this.defaultTokenAddress,
      ERC20_ABI,
      signer,
    );
    const decimals = await usdtContract['decimals']();
    const priceInWei = parseUnits(priceUSDT, decimals);

    // Check if Pasarela is allowed to spend user's USDT
    const allowance = await usdtContract['allowance'](
      this.address(),
      this.PASARELA_ADDRESS,
    );

    if (allowance < priceInWei) {
      // Approve
      const txApprove = await usdtContract['approve'](
        this.PASARELA_ADDRESS,
        priceInWei,
      );
      await txApprove.wait(); // Wait for approval
      this.toast.success('USDT Aprobado. Procediendo a comprar...');
    }

    // 2. Call buyBot in Pasarela
    const pasarela = new Contract(
      this.PASARELA_ADDRESS,
      ABI_XWIN_PURCHASE,
      signer,
    );

    const tx = await pasarela['buyPlan'](tier, userId, priceInWei);
    return tx.wait(); // Return receipt
  }
}
