const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDef = protoLoader.loadSync("runtime.proto", {});

const grpcObject = grpc.loadPackageDefinition(packageDef);
const runtimePackage = grpcObject.runtimePackage;
const PodStatus = runtimePackage.PodStatus;

const server = new grpc.Server();
server.bindAsync("0.0.0.0:40000", grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err != null) {
        console.error(err);
        return;
    }
    console.log(`gRPC server started on port ${port}`);
});

server.addService(runtimePackage.RuntimeService.service, {
    "RunPodSandbox": RunPodSandbox,
    "StopPodSandbox": StopPodSandbox,
    "ListPodSandbox": ListPodSandbox,
});

const podSandboxes = [];

function RunPodSandbox(call, callback) {
    const podSandbox = {
        id: podSandboxes.length + 1,
        config: call.request.config,
        status: PodStatus.RUNNING
    };
    podSandboxes.push(podSandbox);
    callback(null, { id: podSandbox.id, config: podSandbox.config, status: podSandbox.status });
}

function StopPodSandbox(call, callback) {
    const podSandbox = podSandboxes.find(pod => pod.id === call.request.id);
    if (!podSandbox) {
        return callback(null, { message: `No pod with id: ${call.request.id}` });
    }
    if (podSandbox.status === PodStatus.STOPPED) {
        return callback(null, { message: `Pod with id ${call.request.id} is already stopped.` });
    }
    podSandbox.status = PodStatus.STOPPED;
    callback(null, { message: `Pod with id ${call.request.id} is stopped.` });
}

function ListPodSandbox(call) {
    podSandboxes.forEach(podSandbox => call.write({ id: podSandbox.id, config: podSandbox.config, status: podSandbox.status }));
    call.end();
}
