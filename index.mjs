export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));
    
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*" // Enables CORS for your frontend
        },
        body: "Hello from your AWS Lambda backend! Code deployed successfully via CodePipeline.",
    };
};