export const calculateXP = (level: number) => {
  return Math.floor((level / 0.3) ** 2);
};

export const generateDigits = (length: number) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return Math.floor(min + Math.random() * (max - min + 1));
};
