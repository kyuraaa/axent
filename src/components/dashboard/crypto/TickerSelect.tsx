import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CryptoOption {
  symbol: string;
  name: string;
  id: string;
  slug: string;
  logo?: string;
}

interface TickerSelectProps {
  value: string;
  onSelect: (symbol: string, name: string, slug: string) => void;
  cryptoList: CryptoOption[];
  loadingList: boolean;
}

export const TickerSelect = ({ value, onSelect, cryptoList, loadingList }: TickerSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [displayedCount, setDisplayedCount] = useState(50);
  const commandListRef = useRef<HTMLDivElement>(null);

  // Sort cryptoList alphabetically by symbol
  const sortedList = [...cryptoList].sort((a, b) => a.symbol.localeCompare(b.symbol));

  // Filter based on search - prioritize matches that start with search term
  const filteredList = searchValue.trim() 
    ? sortedList.filter(crypto => 
        crypto.symbol.toLowerCase().startsWith(searchValue.toLowerCase()) ||
        crypto.name.toLowerCase().startsWith(searchValue.toLowerCase())
      ).slice(0, 50) // Limit search results to 50
    : sortedList.slice(0, displayedCount);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (searchValue.trim()) return; // Don't load more during search
    
    const target = e.currentTarget;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
    
    const sortedLength = [...cryptoList].length;
    if (scrollPercentage > 0.8 && displayedCount < sortedLength) {
      setDisplayedCount(prev => Math.min(prev + 50, sortedLength));
    }
  }, [searchValue, displayedCount, cryptoList.length]);

  const handleSelect = useCallback((crypto: CryptoOption) => {
    onSelect(crypto.symbol, crypto.name, crypto.slug);
    setOpen(false);
    setDisplayedCount(50);
    setSearchValue('');
  }, [onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loadingList}
        >
          {value || "Pilih ticker..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover border-border shadow-lg" style={{ zIndex: 9999 }}>
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Ketik untuk mencari ticker..." 
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList 
            ref={commandListRef}
            className="max-h-[300px] overflow-y-auto"
            onScroll={handleScroll}
          >
            <CommandEmpty>
              {loadingList ? 'Memuat daftar crypto...' : 'Ticker tidak ditemukan'}
            </CommandEmpty>
            <CommandGroup>
              {searchValue.trim() && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border">
                  Menampilkan hasil pencarian (max 50)
                </div>
              )}
              {filteredList.map((crypto) => (
                <CommandItem
                  key={`${crypto.symbol}-${crypto.id}`}
                  value={`${crypto.symbol} ${crypto.name}`}
                  onSelect={() => handleSelect(crypto)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === crypto.symbol ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {crypto.logo && (
                    <img 
                      src={crypto.logo} 
                      alt={crypto.symbol}
                      className="w-6 h-6 rounded-full mr-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium">{crypto.symbol}</span>
                    <span className="text-xs text-muted-foreground">{crypto.name}</span>
                  </div>
                </CommandItem>
              ))}
              {!searchValue.trim() && displayedCount < [...cryptoList].length && (
                <div className="py-2 text-center text-xs text-muted-foreground">
                  Scroll untuk melihat lebih banyak...
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
