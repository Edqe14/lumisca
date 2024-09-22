export const calculateXP = (level: number) => {
  return Math.floor((level / 0.3) ** 2);
};
