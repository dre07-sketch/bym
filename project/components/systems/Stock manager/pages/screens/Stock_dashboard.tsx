import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

Chart.register(...registerables);
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  Eye,
  RefreshCw,
  Download,
} from 'lucide-react';
// Import modals
import AddItemModal from '../pop up/Addnewitem';
import StockInModal from '../pop up/StockInModal';
import PurchaseOrderModal from '../pop up/PurchaseOrderModal';
import ReportsModal from '../pop up/ReportsModal';
import ItemDetailsModal from '../pop up/ItemDetailsModal';

interface StockManagerDashboardProps {
  onLogout: () => void;
  userRole?: string;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  sku: string;
  price: number;
  quantity: number;
  minStock: number;
  supplier: string | null;
  location: string | null;
  description: string | null;
  imageUrl: string | null;
  lastUpdated: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface Activity {
  id: string;
  action: 'Low Stock Alert' | 'Out of Stock' | 'Stock In';
  item: string;
  quantity: number;
  time: Date;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
}

export default function Stock_Manager_Dashboard({ onLogout }: StockManagerDashboardProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [topMovingItems, setTopMovingItems] = useState<
    { id: number; name: string; moved: number; trend: 'up' | 'down' | 'stable'; stock: number; price: number }[]
  >([]);
  const [categoryData, setCategoryData] = useState<{ category: string; stock: number }[]>([]);

  // Refs for charts
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
const pieChartInstance = useRef<any>(null);
const barChartInstance = useRef<any>(null);
  // Stats
  const [stats, setStats] = useState<
    {
      title: string;
      value: string | number;
      change: string;
      changeType: 'positive' | 'negative';
      icon: React.ComponentType<{ className?: string }>;
      color: string;
    }[]
  >([
    { title: 'Total Items', value: '-', change: '0%', changeType: 'positive', icon: Package, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { title: 'Low Stock Items', value: '-', change: '0%', changeType: 'positive', icon: AlertTriangle, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { title: 'Total Value', value: '-', change: '0%', changeType: 'positive', icon: DollarSign, color: 'bg-gradient-to-r from-emerald-500 to-green-600' },
    { title: 'Active Suppliers', value: '-', change: '0%', changeType: 'positive', icon: Users, color: 'bg-gradient-to-r from-purple-500 to-violet-600' },
  ]);

  // Status breakdown (for pie chart)
  const [statusData, setStatusData] = useState([
    { label: 'In Stock', count: 0, color: '#10B981' },
    { label: 'Low Stock', count: 0, color: '#F59E0B' },
    { label: 'Out of Stock', count: 0, color: '#EF4444' },
  ]);

  // Trigger animations
  useEffect(() => {
    setAnimatedStats(true);
  }, []);

  // Generate recent activity alerts
  const generateRecentActivity = (items: InventoryItem[]): Activity[] => {
    const activity: Activity[] = [];
    const now = new Date();
    items
      .filter(item => item.quantity > 0 && item.quantity <= item.minStock)
      .forEach(item => {
        activity.push({
          id: `low-${item.id}`,
          action: 'Low Stock Alert',
          item: item.name,
          quantity: item.quantity,
          time: now,
          icon: AlertTriangle,
          color: 'bg-amber-100',
          textColor: 'text-amber-600'
        });
      });
    items
      .filter(item => item.quantity === 0)
      .forEach(item => {
        activity.push({
          id: `out-${item.id}`,
          action: 'Out of Stock',
          item: item.name,
          quantity: 0,
          time: now,
          icon: AlertTriangle,
          color: 'bg-red-100',
          textColor: 'text-red-600'
        });
      });
    return activity;
  };

  // Time ago formatter
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Fetch inventory data
  const fetchInventoryData = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/items');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'API error');
      const items: InventoryItem[] = result.data;
      setInventoryItems(items);

      // Update stats
      const totalItems = items.length;
      const lowStockItems = items.filter(item => item.quantity <= item.minStock).length;
      const totalValue = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const activeSuppliers = new Set(items.map(item => item.supplier).filter(Boolean)).size;

      setStats([
        { ...stats[0], value: totalItems.toLocaleString() },
        { ...stats[1], value: lowStockItems, changeType: lowStockItems > 0 ? 'negative' : 'positive', change: `+${lowStockItems}` },
        { ...stats[2], value: `$${totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` },
        { ...stats[3], value: activeSuppliers }
      ]);

      // Update recent activity
      setRecentActivity(generateRecentActivity(items));
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch top moving items
  const fetchTopMovingItems = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/top-moving');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      const items = result.data.map((item: any, index: number) => ({
        id: item.id || index + 1,
        name: item.name,
        moved: item.quantity,
        trend: item.quantity > 50 ? 'up' : item.quantity > 10 ? 'stable' : 'down',
        stock: item.quantity,
        price: item.price
      }));
      setTopMovingItems(items);
    } catch (error) {
      console.error('Failed to fetch top moving items:', error);
      setTopMovingItems([]);
    }
  };

  // Fetch category-wise stock from backend
  const fetchCategoryStock = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/categories/stock');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      setCategoryData(result.data);
    } catch (error) {
      console.error('Failed to fetch category stock:', error);
      // Fallback: frontend aggregation
      const categoryMap = new Map<string, number>();
      inventoryItems.forEach(item => {
        const current = categoryMap.get(item.category) || 0;
        categoryMap.set(item.category, current + item.quantity);
      });
      const fallbackData = Array.from(categoryMap.entries()).map(([category, stock]) => ({ category, stock }));
      setCategoryData(fallbackData);
    }
  };

  // Pie Chart: Inventory Status
  useEffect(() => {
    if (inventoryItems.length === 0) return;
    const inStock = inventoryItems.filter(item => item.status === 'In Stock').length;
    const lowStock = inventoryItems.filter(item => item.status === 'Low Stock').length;
    const outOfStock = inventoryItems.filter(item => item.status === 'Out of Stock').length;

    setStatusData([
      { label: 'In Stock', count: inStock, color: '#10B981' },
      { label: 'Low Stock', count: lowStock, color: '#F59E0B' },
      { label: 'Out of Stock', count: outOfStock, color: '#EF4444' },
    ]);

    const ctx = chartRef.current?.getContext('2d');
  if (!ctx) return;
     if (pieChartInstance.current) {
    pieChartInstance.current.destroy();
  }


    pieChartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['In Stock', 'Low Stock', 'Out of Stock'],
        datasets: [{
          data: [inStock, lowStock, outOfStock],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        animation: { animateRotate: true, animateScale: true }
      }
    });

    return () => {
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }
  };
}, [inventoryItems]);

   // Beautiful color palette
  const colorPalette = [
    {
      gradient: ['#667eea', '#764ba2'],
      solid: '#667eea',
      shadow: 'rgba(102, 126, 234, 0.3)'
    },
    {
      gradient: ['#f093fb', '#f5576c'],
      solid: '#f093fb',
      shadow: 'rgba(240, 147, 251, 0.3)'
    },
    {
      gradient: ['#4facfe', '#00f2fe'],
      solid: '#4facfe',
      shadow: 'rgba(79, 172, 254, 0.3)'
    },
    {
      gradient: ['#43e97b', '#38f9d7'],
      solid: '#43e97b',
      shadow: 'rgba(67, 233, 123, 0.3)'
    },
    {
      gradient: ['#fa709a', '#fee140'],
      solid: '#fa709a',
      shadow: 'rgba(250, 112, 154, 0.3)'
    },
    {
      gradient: ['#a8edea', '#fed6e3'],
      solid: '#a8edea',
      shadow: 'rgba(168, 237, 234, 0.3)'
    },
    {
      gradient: ['#ff9a9e', '#fecfef'],
      solid: '#ff9a9e',
      shadow: 'rgba(255, 154, 158, 0.3)'
    },
    {
      gradient: ['#c471f5', '#fa71cd'],
      solid: '#c471f5',
      shadow: 'rgba(196, 113, 245, 0.3)'
    }
  ];

  
  // Bar Chart: Category-wise Stock (now based on categoryData)
  // Bar Chart: Category-wise Stock (now based on categoryData)
useEffect(() => {
  if (categoryData.length === 0) return;

  const ctx = barChartRef.current?.getContext('2d');
  if (!ctx) return;

  if (barChartInstance.current) {
    barChartInstance.current.destroy();
  }

  // Create beautiful gradients for each bar
  const gradients = categoryData.map((_, index) => {
    const colorIndex = index % colorPalette.length;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorPalette[colorIndex].gradient[0]);
    gradient.addColorStop(1, colorPalette[colorIndex].gradient[1]);
    return gradient;
  });

  // Create hover gradients
  const hoverGradients = categoryData.map((_, index) => {
    const colorIndex = index % colorPalette.length;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorPalette[colorIndex].gradient[0] + 'DD');
    gradient.addColorStop(1, colorPalette[colorIndex].gradient[1] + 'DD');
    return gradient;
  });

  // Custom plugin for shadows (since Chart.js doesn't support them natively)
  const shadowPlugin = {
    id: 'customShadow',
    beforeDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);
      meta.data.forEach((bar: any, index: number) => {
        const colorIndex = index % colorPalette.length;
        const shadowColor = colorPalette[colorIndex].shadow;

       ctx.save();
ctx.shadowColor = shadowColor;
ctx.shadowBlur = 20;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 10;
ctx.restore();
      });
    }
  };

  // Custom plugin to draw labels on top of bars
  const topLabelsPlugin = {
    id: 'topLabels',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);
      meta.data.forEach((bar: any, index: number) => {
        const value = dataset.data[index];
        ctx.fillText(
          value.toLocaleString(),
          bar.x,
          bar.y - 8
        );
      });
    }
  };

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: categoryData.map(d => d.category),
      datasets: [{
        label: 'Stock Quantity',
        data: categoryData.map(d => d.stock),
        backgroundColor: gradients,
        hoverBackgroundColor: hoverGradients,
        borderColor: categoryData.map((_, index) => {
          const colorIndex = index % colorPalette.length;
          return colorPalette[colorIndex].solid + '40';
        }),
        borderWidth: 2,
        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 4,
          bottomRight: 4
        },
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 10,
          right: 10
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeOutElastic',
        delay: (context) => context.dataIndex * 200
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#F9FAFB',
          bodyColor: '#F9FAFB',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 12,
          displayColors: false,
          titleFont: {
            size: 14,
            weight: 600  // ✅ Fixed: was string "600" → now number
          },
          bodyFont: {
            size: 13,
            weight: 500  // ✅ Fixed: was string "500" → now number
          },
          padding: 16,
          callbacks: {
            title: function(context) {
              return `📦 ${context[0].label}`;
            },
            label: function(context) {
              const value = context.parsed.y;
              return `Stock: ${value.toLocaleString()} units`;
            },
            afterLabel: function(context) {
              const total = categoryData.reduce((sum, item) => sum + item.stock, 0);
              const percentage = ((context.parsed.y / total) * 100).toFixed(1);
              return `${percentage}% of total stock`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.03)',
            lineWidth: 1,
            display: true
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12,
              weight: 500  // ✅ Fixed: was string "500" → now number
            },
            padding: 12,
            callback: function(value) {
              return typeof value === 'number' ? value.toLocaleString() : value;
            }
          },
          border: {
            display: false  // ✅ Fixed: was {drawBorder: false} → now correct
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#374151',
            font: {
              size: 12,
              weight: 600  // ✅ Fixed: was string "600" → now number
            },
            padding: 8,
            maxRotation: 0
          },
          border: {
            display: false  // ✅ Fixed: was {drawBorder: false} → now correct
          }
        }
      },
      onHover: (event, activeElements, chart) => {
        if (barChartRef.current) {
          barChartRef.current.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
      }
    },
    plugins: [shadowPlugin, topLabelsPlugin]  // ✅ Custom plugins added here
  };

  barChartInstance.current = new Chart(ctx, config);

  return () => {
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }
  };
}, [categoryData]);


  // Fetch data on mount and refresh
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchInventoryData(),
        fetchTopMovingItems(),
        fetchCategoryStock()
      ]);
    };

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([fetchInventoryData(), fetchTopMovingItems(), fetchCategoryStock()])
      .finally(() => setIsRefreshing(false));
  };

  const openModal = (modalType: string, item?: InventoryItem) => {
    setActiveModal(modalType);
    if (item) setSelectedItem(item);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Stock Management
            </h1>
            <p className="text-gray-600 mt-2">Monitor and manage your inventory in real-time</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className={`p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${isRefreshing ? 'animate-spin' : ''}`}
              disabled={isRefreshing}
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Download className="w-4 h-4" />
              <span className="font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${!loadingStats && animatedStats ? 'animate-fade-in-up' : 'opacity-70'}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {loadingStats ? <span className="animate-pulse">Loading...</span> : stat.value}
                  </p>
                  <div className="flex items-center">
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">vs last month</span>
                  </div>
                </div>
                <div className={`${stat.color} p-4 rounded-2xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">


         {/* Inventory Status Pie Chart */}
<div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
  <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-3"></div>
    Inventory Status Overview
  </h3>

  <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
    {/* Pie Chart Canvas */}
    <div className="w-full lg:w-1/2 xl:w-96 aspect-square flex items-center justify-center">
      <canvas ref={chartRef} className="max-w-full h-auto" />
    </div>

    {/* Legend & Stats */}
    <div className="flex-1 space-y-3 min-w-0">
      {statusData.map((status) => (
        <div
          key={status.label}
          className="group p-5 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-2xl 
                     shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 
                     transform hover:scale-105 hover:from-white hover:to-blue-50"
        >
          <div className="flex items-center justify-between">
            {/* Label & Color Dot */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 shadow-inner"
                style={{ backgroundColor: status.color }}
              ></div>
              <span className="font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                {status.label}
              </span>
            </div>

            {/* Count Badge */}
            <div className="flex-shrink-0">
              <span
                className={`px-4 py-1.5 text-sm font-bold rounded-full shadow-sm
                           ${status.label === 'In Stock'
                    ? 'bg-green-100 text-green-800'
                    : status.label === 'Low Stock'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
              >
                {status.count.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Progress Bar (Optional) */}
          {status.label !== 'Out of Stock' && (
            <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(status.count / (statusData.reduce((a, b) => a + b.count, 0))) * 100}%`,
                  backgroundColor: status.color
                }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
</div>

          {/* Category-wise Stock Bar Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Stock by Category</h3>
            <div className="h-80 flex items-center justify-center">
              <canvas ref={barChartRef} />
            </div>
          </div>
        </div>

        
 {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => openModal('addItem')} className="flex flex-col items-center p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group transform hover:scale-105">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors mb-3">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Add Item</span>
            </button>
            <button onClick={() => openModal('stockIn')} className="flex flex-col items-center p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 group transform hover:scale-105">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <span className="font-semibold text-gray-700 group-hover:text-green-600 transition-colors">Stock In</span>
            </button>
            <button onClick={() => openModal('purchaseOrder')} className="flex flex-col items-center p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 group transform hover:scale-105">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors mb-3">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">New PO</span>
            </button>
            <button onClick={() => openModal('reports')} className="flex flex-col items-center p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 group transform hover:scale-105">
              <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors mb-3">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
              <span className="font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">Reports</span>
            </button>
          </div>
        </div>
      </div>


        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">



          
          {/* Recent Activity */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              <div className="flex items-center space-x-3">
                <button onClick={handleRefresh} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh activity">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                  View All
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No alerts at this time</p>
              ) : (
                recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
                    <div className={`p-3 rounded-xl ${activity.color} transition-colors`}>
                      <activity.icon className={`w-5 h-5 ${activity.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.item}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">Qty: {activity.quantity}</p>
                      <p className="text-xs text-gray-500">{getTimeAgo(activity.time)}</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 rounded-lg transition-all">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Moving Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Top Moving</h3>
              <button onClick={() => openModal('reports')} className="text-blue-600 hover:text-blue-700 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                View Report
              </button>
            </div>
            <div className="space-y-3">
              {topMovingItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    const fullItem = inventoryItems.find(inv => inv.name === item.name);
                    if (fullItem) openModal('itemDetails', fullItem);
                    else console.warn('Item not found:', item.name);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center font-bold text-gray-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.moved} units moved</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-full ${item.trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {item.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

       

      

      {/* Modals */}
      {activeModal === 'addItem' && <AddItemModal onClose={closeModal} isOpen={true} onItemAdded={handleRefresh} />}
      {activeModal === 'stockIn' && <StockInModal onClose={closeModal} />}
      {activeModal === 'purchaseOrder' && <PurchaseOrderModal onClose={closeModal} />}
      {activeModal === 'reports' && <ReportsModal onClose={closeModal} />}
      {/* {activeModal === 'itemDetails' && selectedItem && <ItemDetailsModal item={selectedItem} onClose={closeModal} />} */}
    </div>
  );
}