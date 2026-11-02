import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Compass, Hotel, Activity } from 'lucide-react';
import { useTripBasket } from '../../context/TripBasketContext';
import { Button } from './Button';
import { Badge } from './Badge';
import { useNavigate } from 'react-router-dom';

export const TripBasketDrawer: React.FC = () => {
  const { items, removeItem, clearBasket, isDrawerOpen, setIsDrawerOpen, totalAmount, itemCount } = useTripBasket();
  const navigate = useNavigate();

  const handleProceedToRequest = () => {
    setIsDrawerOpen(false);
    // Find primary destination from items
    const primaryDest = items.find((i) => i.destinationName)?.destinationName || '';
    const summary = items.map((i) => `${i.title} (${i.type.toLowerCase()})`).join(', ');
    navigate(`/traveler/create-trip?destination=${encodeURIComponent(primaryDest)}&notes=${encodeURIComponent(`Selected items from marketplace: ${summary}`)}`);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'HOTEL':
        return <Hotel className="w-4 h-4 text-cyan-400" />;
      case 'ACTIVITY':
        return <Activity className="w-4 h-4 text-teal-400" />;
      case 'PACKAGE':
        return <Compass className="w-4 h-4 text-amber-400" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <>
      {/* Floating Trip Basket Trigger on bottom right if items exist */}
      <AnimatePresence>
        {itemCount > 0 && !isDrawerOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 flex items-center gap-3 cursor-pointer transition-transform hover:scale-105 active:scale-95 border border-cyan-300/30"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-slate-950" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-950 text-cyan-300 text-[11px] font-black flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <span>Trip Plan ({items.length})</span>
              <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded-md">
                ₹{totalAmount.toLocaleString()}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer Backdrop and Panel */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-surface-elevated/95 backdrop-blur-xl border-l border-border/80 shadow-2xl flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-6 border-b border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Trip Planner Draft
                        <Badge variant="cyan" size="sm">{itemCount} items</Badge>
                      </h3>
                      <p className="text-xs text-slate-400">Items selected for custom booking</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-slate-500 mb-4">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-white">Your trip basket is empty</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Browse marketplace destinations, hotels, activities, and packages to add them to your journey.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Selected Experiences
                        </span>
                        <button
                          onClick={clearBasket}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Clear All
                        </button>
                      </div>

                      {items.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="p-3.5 rounded-2xl bg-surface border border-border/80 flex gap-3.5 items-center justify-between group hover:border-cyan-500/30 transition-all"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-surface-dark border border-border flex items-center justify-center flex-shrink-0">
                              {getItemIcon(item.type)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-semibold uppercase tracking-wider">
                              {getItemIcon(item.type)}
                              <span>{item.type}</span>
                              {item.destinationName && <span>• {item.destinationName}</span>}
                            </div>
                            <h4 className="text-sm font-bold text-white truncate mt-0.5">{item.title}</h4>
                            <p className="text-xs text-slate-300 font-mono mt-0.5">
                              ₹{item.price.toLocaleString()} {item.quantity && item.quantity > 1 ? `× ${item.quantity}` : ''}
                            </p>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Footer / Summary and Action CTAs */}
                {items.length > 0 && (
                  <div className="p-6 border-t border-border/80 bg-surface/90 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Estimated Total ({itemCount} items)</span>
                        <span className="text-base font-extrabold text-cyan-300 font-mono">
                          ₹{totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Protected by PayPal Developer Sandbox Escrow</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        onClick={handleProceedToRequest}
                      >
                        Request Custom Itinerary
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        fullWidth
                        onClick={() => setIsDrawerOpen(false)}
                      >
                        Continue Exploring
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
