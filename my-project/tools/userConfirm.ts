import getUserInput from "./getUserInput.ts";

export const userConfirm = async <T>(
  callback: () => T | Promise<T>,
  prompt = "确认执行？(y/n): ",
): Promise<T | null> => {
  const input = await getUserInput(prompt);

  if (input === "y" || input === "yes") {
    return callback();
  }

  return null;
};
