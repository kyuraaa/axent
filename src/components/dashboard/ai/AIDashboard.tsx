import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

const AIDashboard = () => {
  const navigate = useNavigate();

  const aiInsights = [
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'Spending Alert',
      description: 'Pengeluaran kategori Entertainment naik 45% dari bulan lalu',
      action: 'Lihat Detail',
      color: 'text-yellow-500'
    },
    {
      type: 'opportunity',
      icon: TrendingUp,
      title: 'Saving Opportunity',
      description: 'Anda bisa menghemat Rp 500.000/bulan dengan menggabungkan subscription',
      action: 'Lihat Rekomendasi',
      color: 'text-green-500'
    },
    {
      type: 'insight',
      icon: Lightbulb,
      title: 'Investment Insight',
      description: 'Portfolio Anda sudah naik 12% YTD, pertimbangkan rebalancing',
      action: 'Analisis Portfolio',
      color: 'text-blue-500'
    }
  ];

  const aiModules = [
    { name: 'Financial Advisor', description: 'Chat dengan AI untuk advice keuangan', route: 'advisor', usage: 75 },
    { name: 'Smart Insights', description: 'Deteksi anomali & warning otomatis', route: 'smart-insights', usage: 60 },
    { name: 'Receipt Scanner', description: 'Scan & extract data dari receipt', route: 'scanners', usage: 30 },
    { name: 'Forecasting', description: 'Proyeksi cashflow & pengeluaran', route: 'forecasting', usage: 45 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Dashboard</h1>
          <p className="text-muted-foreground">Ringkasan insight AI dari seluruh data keuangan Anda</p>
        </div>
      </div>

      {/* AI Health Score */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Financial Health Score
          </CardTitle>
          <CardDescription>Skor kesehatan keuangan berdasarkan analisis AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${78 * 3.52} ${100 * 3.52}`}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold">78</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pengeluaran</span>
                  <span className="text-green-500">Baik</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tabungan</span>
                  <span className="text-yellow-500">Perlu Perhatian</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Investasi</span>
                  <span className="text-green-500">Sangat Baik</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>AI Insights Terbaru</CardTitle>
          <CardDescription>Insight otomatis dari analisis data keuangan Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiInsights.map((insight, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className={`p-2 rounded-lg bg-white/10 ${insight.color}`}>
                <insight.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{insight.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">
                {insight.action}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiModules.map((module, index) => (
          <Card key={index} className="glass-card cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate(`/dashboard?tab=${module.route}`)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{module.name}</h3>
                <span className="text-sm text-muted-foreground">{module.usage}% used</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
              <Progress value={module.usage} className="h-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIDashboard;
