import { tool } from "@langchain/core/tools";
import { z } from "zod";

type WeatherResponse = {
  province: string;
  city: string;
  adcode: string;
  weather: string;
  weather_icon: string;
  temperature: number;
  wind_direction: string;
  wind_power: string;
  humidity: number;
  report_time: string;
};

export const getWeather = tool(
  async ({ cityName }: { cityName: string }) => {
    try {
      const res: WeatherResponse = await fetch(
        "https://uapis.cn/api/v1/misc/weather?city=" + cityName,
      ).then((res) => res.json());

      return res
    } catch (error) {
      return `获取${cityName}天气失败，请检查城市名称是否正确，或者请求额度是否充足。`;
    }
  },
  {
    name: "getWeather",
    description:
      "获取指定城市的实时天气信息，返回天气、温度、风向、湿度等数据。根据用户的问题灵活组织回答，不要每次都用固定格式输出。",
    schema: z.object({
      cityName: z.string().describe("城市名称，例如：北京、上海、盐城"),
    }),
  },
);
