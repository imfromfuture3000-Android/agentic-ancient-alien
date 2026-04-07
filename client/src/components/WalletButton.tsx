import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export function WalletButton() {
  const { wallet, connect, disconnect, connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={`
        border-primary/50 text-primary hover:bg-primary/20 hover:text-primary 
        font-mono uppercase tracking-widest relative overflow-hidden transition-all
        ${connected ? 'bg-primary/10 shadow-[0_0_10px_rgba(0,255,0,0.3)]' : ''}
      `}
    >
      {connected && publicKey ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
          <span>{formatAddress(publicKey.toBase58())}</span>
          <LogOut className="w-4 h-4 ml-2" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>Sync Neural Link</span>
        </div>
      )}
    </Button>
  );
}
