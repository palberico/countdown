import { useState, useEffect } from 'react';

const useCountdown = (targetDate) => {
  // targetDate is a Date object or a timestamp
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  function getTimeLeft(date) {
    const now = new Date().getTime();
    const distance = date - now;

    return distance;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

export default useCountdown;
