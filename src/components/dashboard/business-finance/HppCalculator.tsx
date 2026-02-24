import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HppCalculator = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    beginningInventory: '',
    purchases: '',
    endingInventory: '',
    directLabor: '',
    manufacturing: '',
  });

  const [result, setResult] = useState<{
    cogs: number;
    totalCost: number;
    costPerUnit?: number;
    unitsProduced?: number;
  } | null>(null);

  const calculateHPP = () => {
    const beginningInventory = parseFloat(formData.beginningInventory) || 0;
    const purchases = parseFloat(formData.purchases) || 0;
    const endingInventory = parseFloat(formData.endingInventory) || 0;
    const directLabor = parseFloat(formData.directLabor) || 0;
    const manufacturing = parseFloat(formData.manufacturing) || 0;

    // HPP/COGS = Beginning Inventory + Purchases + Direct Labor + Manufacturing Overhead - Ending Inventory
    const cogs = beginningInventory + purchases + directLabor + manufacturing - endingInventory;
    const totalCost = beginningInventory + purchases + directLabor + manufacturing;

    setResult({
      cogs,
      totalCost,
    });

    toast({
      title: 'Berhasil',
      description: 'HPP berhasil dihitung',
    });
  };

  const reset = () => {
    setFormData({
      beginningInventory: '',
      purchases: '',
      endingInventory: '',
      directLabor: '',
      manufacturing: '',
    });
    setResult(null);
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Kalkulator HPP (Harga Pokok Penjualan)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="beginningInventory">Persediaan Awal</Label>
            <Input
              id="beginningInventory"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.beginningInventory}
              onChange={(e) => setFormData({ ...formData, beginningInventory: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="purchases">Pembelian Bahan Baku</Label>
            <Input
              id="purchases"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.purchases}
              onChange={(e) => setFormData({ ...formData, purchases: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="directLabor">Biaya Tenaga Kerja Langsung</Label>
            <Input
              id="directLabor"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.directLabor}
              onChange={(e) => setFormData({ ...formData, directLabor: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="manufacturing">Biaya Overhead Produksi</Label>
            <Input
              id="manufacturing"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.manufacturing}
              onChange={(e) => setFormData({ ...formData, manufacturing: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endingInventory">Persediaan Akhir</Label>
            <Input
              id="endingInventory"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.endingInventory}
              onChange={(e) => setFormData({ ...formData, endingInventory: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={calculateHPP} className="flex-1">
            Hitung HPP
          </Button>
          <Button onClick={reset} variant="outline">
            Reset
          </Button>
        </div>

        {result && (
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Biaya Produksi:</span>
              <span className="text-lg font-bold">
                Rp {result.totalCost.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-primary/20">
              <span className="text-sm font-medium">HPP / COGS:</span>
              <span className="text-2xl font-bold text-primary">
                Rp {result.cogs.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Formula: Persediaan Awal + Pembelian + Tenaga Kerja + Overhead - Persediaan Akhir
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HppCalculator;
