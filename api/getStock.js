import fetch from "node-fetch";

export default async function handler(req, res) {
  const symbol = req.query.symbol || "7203.T";
  const apiKey = process.env.ALPHA_VANTAGE_KEY;

  try {
    // 株価を取得
    const priceUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const priceRes = await fetch(priceUrl);
    const priceData = await priceRes.json();

    // 配当を取得
    const dividendUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}`;
    const dividendRes = await fetch(dividendUrl);
    const dividendData = await dividendRes.json();

    let dividend = 0;
    const timeSeries = dividendData["Monthly Adjusted Time Series"];
    if (timeSeries) {
      const months = Object.keys(timeSeries).slice(0, 12);
      months.forEach(month => {
        dividend += parseFloat(timeSeries[month]["7. dividend amount"] || 0);
      });
    }

    const price = parseFloat(priceData["Global Quote"]["05. price"]);
    const yieldPercent = ((dividend / price) * 100).toFixed(2);

    // CORS設定（Bloggerから呼び出し可）
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.status(200).json({
      price,
      dividend,
      yield: yieldPercent
    });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "データ取得に失敗しました" });
  }
}
