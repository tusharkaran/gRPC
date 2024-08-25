const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDef = protoLoader.loadSync("runtime.proto", {});

const grpcObject = grpc.loadPackageDefinition(packageDef);
const runtimePackage = grpcObject.runtimePackage;
const client = new runtimePackage.RuntimeService(
    "localhost:40000",
    grpc.credentials.createInsecure()
);

// specifies which method is being called
const method = process.argv[2];
// parameter could be config for RunPodSandbox or id for StopPodSandbox
const param = process.argv[3];

switch (method) {
    case "run":
        client.RunPodSandbox({ config: param }, (err, response) => {
            if (err) {
                console.error("Error running pod: ", err);
                return;
            }
            console.log("Pod running with ID: ", response.id);
            console.log("Pod config: ", response.config);
            console.log("Pod status: ", response.status);
        });
        break;
    case "stop":
        client.StopPodSandbox({ id: parseInt(param) }, (err, response) => {
            if (err) {
                console.error("Error stopping pod: ", err);
                return;
            }
            console.log(response.message);
        });
        break;
    default:
        const call = client.ListPodSandbox();
        call.on("data", response => {
            console.log("Received pod from server: ", JSON.stringify(response));
        });
        call.on("end", () => console.log("Server done!"));
        call.on("error", (err) => console.error("Error: ", err));
        break;
}
