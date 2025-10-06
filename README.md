# Alice Ephermal (alice-eph) 命令行客户端

本项目是一个用于与 [Alice.ws](https://app.alice.ws/) Ephermal API 交互的 Go 语言客户端。它提供了一系列命令行工具，方便用户管理其云实例（Evo）。

## 功能特性

通过此客户端，您可以执行以下操作：

*   **实例管理**:
    *   列出、部署、销毁、重建您的云实例。
    *   控制实例的电源状态（启动、停止、重启）。
    *   查看实例的详细状态和信息。
    *   为实例续期。
*   **资源查看**:
    *   浏览所有可用的部署方案。
    *   根据方案查询可用的操作系统。
*   **账户管理**:
    *   查看您的账户信息和余额。
    *   管理您的 SSH 密钥。
    *   查询您的 EVO 权限。

## 安装

确保您已经安装了 Go 环境，然后执行以下命令：

```bash
go get github.com/imhuimie/alice-eph
```

## 快速开始

1.  **获取 API Token**:
    请在您的 Alice.ws 账户设置中生成一个 API Token。

2.  **设置 Token**:
    您可以通过设置环境变量或使用命令行参数来提供您的 Token。

    ```bash
    export ALICE_EPH_TOKEN="your_api_token_here"
    ```

3.  **使用方法**:
    该客户端通过命令行参数来执行不同的操作。例如，要列出您所有的实例，可以运行：

    ```bash
    go run api_client.go -action list
    ```

    要部署一个新实例，您需要提供方案ID、操作系统ID和部署时长：

    ```bash
    go run api_client.go -action deploy -product_id 1 -os_id 1 -time 1
    ```

## 命令列表

以下是支持的主要命令 (`-action` 参数):

*   `list`: 列出所有实例。
*   `deploy`: 部署一个新实例。 (需要 `-product_id`, `-os_id`, `-time` 参数)
*   `destroy`: 销毁一个实例。 (需要 `-id` 参数)
*   `power`: 管理实例电源。 (需要 `-id` 和 `-power_action` 参数，如 `start`, `stop`, `reboot`)
*   `rebuild`: 重建一个实例。 (需要 `-id`, `-os` 参数)
*   `plans`: 列出所有可用方案。
*   `os`: 根据方案ID列出可用操作系统。(需要 `-plan_id` 参数)
*   `renew`: 为实例续期。 (需要 `-id`, `-renew_time` 参数)
*   `state`: 获取实例的当前状态。 (需要 `-id` 参数)
*   `sshkeys`: 列出所有 SSH 密钥。
*   `evo-perms`: 查看 EVO 权限。
*   `user-info`: 查看当前用户信息。

详细参数请参考 `api_client.go` 文件中的 `flag` 定义。