import * as Readline from "node:readline/promises";

/**
 * 询问用户输入的封装
 * @param {string} prompt 提问符
 * @returns {Promise<string | null>} `string` 用户输入的内容 | `null` 用户输入了退出指令
 */
const getUserInput = async (prompt: string): Promise<string | null> => {
  const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let input: string | null = null;
  try {
    input = await rl.question(prompt);
    rl.close();
  } catch (err: any) {
    if (err.code === "ABORT_ERR") {
      return null;
    }
    throw err;
  } finally {
    rl.close();
  }
  if (input === "exit" || input === "quit" || input === "q") {
    return null;
  }
  return input;
};

export default getUserInput;
