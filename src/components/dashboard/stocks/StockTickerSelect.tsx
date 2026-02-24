import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
  symbol: string;
  description: string;
  type: string;
}

interface StockTickerSelectProps {
  value: string;
  onValueChange: (symbol: string, name: string) => void;
  disabled?: boolean;
}

export function StockTickerSelect({ value, onValueChange, disabled }: StockTickerSelectProps) {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (searchQuery.length >= 1) {
      searchStocks(searchQuery);
    } else {
      setStocks([]);
    }
  }, [searchQuery]);

  const searchStocks = async (query: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('stock-list', {
        body: { query }
      });

      if (error) throw error;

      setStocks(data.stocks || []);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (stock: Stock) => {
    onValueChange(stock.symbol, stock.description);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || "Pilih ticker saham..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50 bg-popover" align="start" sideOffset={4}>
        <Command shouldFilter={false} className="bg-popover">
          <CommandInput 
            placeholder="Ketik untuk mencari ticker..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="bg-popover"
          />
          <CommandList className="max-h-[300px] overflow-y-auto bg-popover">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty className="py-6 text-center text-sm">
                  {searchQuery.length < 1 
                    ? "Ketik untuk mencari ticker saham..." 
                    : "Tidak ada ticker ditemukan."}
                </CommandEmpty>
                {stocks.length > 0 && (
                  <CommandGroup className="bg-popover">
                    {stocks.slice(0, 50).map((stock) => (
                      <CommandItem
                        key={stock.symbol}
                        value={stock.symbol}
                        onSelect={() => handleSelect(stock)}
                        className="cursor-pointer hover:bg-accent"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === stock.symbol ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{stock.symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            {stock.description}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
