export const handler = async (event) => {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
      body: JSON.stringify({
        message: "Hello from your AWS Lambda backend! Triggered directly from your HTML UI.",
        timestamp: new Date().toISOString()
      }),
    };
  };