import React, { createContext, useContext, useState, useEffect } from 'react';

const ItemExportContext = createContext();

export const useItemExport = () => {
  const context = useContext(ItemExportContext);
  if (!context) {
    return {
      item: null,
      category: null,
      selectedRates: [],
      orderAmount: '',
      showBottomBar: false,
      countdown: 0,
      isCounting: false,
      setSelectedRates: () => {},
      setOrderAmount: () => {},
      setShowBottomBar: () => {},
      startCountdown: () => {}
    };
  }
  return context;
};

// Parse thời gian từ chuỗi như "2 phút" thành giây
const parseGameTime = (gameTime) => {
  if (!gameTime) return 120; // Mặc định 2 phút
  
  const match = gameTime.match(/(\d+)\s*phút/);
  if (match) {
    return parseInt(match[1]) * 60; // Chuyển phút thành giây
  }
  
  // Nếu không match, thử parse số trực tiếp (giả sử là giây)
  const seconds = parseInt(gameTime);
  return isNaN(seconds) ? 120 : seconds;
};

export const ItemExportProvider = ({ children }) => {
  const [item, setItem] = useState(null);
  const [category, setCategory] = useState(null);
  const [selectedRates, setSelectedRates] = useState([]);
  const [orderAmount, setOrderAmount] = useState('');
  const [showBottomBar, setShowBottomBar] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [isCounting, setIsCounting] = useState(false);

  // Đồng bộ đếm ngược theo chu kỳ game của item (liên tục chạy)
  useEffect(() => {
    if (!item || !item.game) return;
    const duration = parseGameTime(item.game);
    const update = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const rem = duration - (nowSec % duration);
      setCountdown(rem === 0 ? duration : rem);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [item]);

  // Countdown timer
  useEffect(() => {
    let interval = null;
    if (isCounting && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsCounting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdown === 0 && isCounting) {
      setIsCounting(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCounting, countdown]);

  // Bắt đầu countdown thủ công (khi bấm xuất đơn)
  const startCountdown = () => {
    if (item && item.game) {
      const seconds = parseGameTime(item.game);
      const nowSec = Math.floor(Date.now() / 1000);
      const rem = seconds - (nowSec % seconds);
      setCountdown(rem === 0 ? seconds : rem);
      setIsCounting(true);
    }
  };

  return (
    <ItemExportContext.Provider
      value={{
        item,
        category,
        selectedRates,
        orderAmount,
        showBottomBar,
        countdown,
        isCounting,
        setItem,
        setCategory,
        setSelectedRates,
        setOrderAmount,
        setShowBottomBar,
        startCountdown
      }}
    >
      {children}
    </ItemExportContext.Provider>
  );
};

