package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const baseURL = "https://app.alice.ws/cli/v1"

// --- 响应结构体定义 ---

// 通用 API 响应结构
type APIResponse struct {
	Status  int             `json:"status"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

// Instance 定义了实例的数据结构
type Instance struct {
	ID           int    `json:"id"`
	UID          string `json:"uid"`
	IPv4         string `json:"ipv4"`
	IPv6         string `json:"ipv6"`
	Hostname     string `json:"hostname"`
	CPU          int    `json:"cpu"`
	CPUName      string `json:"cpu_name"`
	Memory       int    `json:"memory"`
	Disk         string `json:"disk"`
	DiskType     string `json:"disk_type"`
	User         string `json:"user"`
	Password     string `json:"password"`
	Status       string `json:"status"`
	CreationAt   string `json:"creation_at"`
	ExpirationAt string `json:"expiration_at"`
	Plan         string `json:"plan"`
	Region       string `json:"region"`
	OS           string `json:"os"`
	ShowSpeed    string `json:"show_speed"`
}

// DeployResponse 定义了部署成功后返回的数据结构
type DeployResponse struct {
	ID       string `json:"id"`
	Password string `json:"password"`
	IPv4     string `json:"ipv4"`
	IPv6     string `json:"ipv6"`
	Hostname string `json:"hostname"`
}

// RebuildResponse 定义了重建成功后返回的数据结构
type RebuildResponse struct {
	IPv4     string `json:"ipv4"`
	IPv6     string `json:"ipv6"`
	Hostname string `json:"hostname"`
	Password string `json:"password"`
}

// Plan 定义了方案的数据结构
type Plan struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Stock        int       `json:"stock"`
	CPU          int       `json:"cpu"`
	Memory       int       `json:"memory"`
	Disk         int       `json:"disk"`
	NetworkSpeed string    `json:"network_speed"`
	OSGroups     []OSGroup `json:"os"`
}

// OSGroup 定义了操作系统组的数据结构
type OSGroup struct {
	GroupName string `json:"group_name"`
	OSList    []OS   `json:"os_list"`
}

// OS 定义了操作系统的数据结构
type OS struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// RenewalResponse 定义了续订成功后返回的数据结构
type RenewalResponse struct {
	ExpirationAt      string `json:"expiration_at"`
	AddedHours        string `json:"added_hours"`
	TotalServiceHours int    `json:"total_service_hours"`
}

// StateResponse 定义了实例状态的数据结构
type StateResponse struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	State  struct {
		Memory struct {
			Total     string `json:"memtotal"`
			Free      string `json:"memfree"`
			Available string `json:"memavailable"`
		} `json:"memory"`
		CPU     int    `json:"cpu"`
		State   string `json:"state"`
		Traffic struct {
			In    int `json:"in"`
			Out   int `json:"out"`
			Total int `json:"total"`
		} `json:"traffic"`
	} `json:"state"`
	System struct {
		Name      string `json:"name"`
		GroupName string `json:"group_name"`
	} `json:"system"`
}

// SSHKey 定义了 SSH 密钥的数据结构
type SSHKey struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	PublicKey string `json:"publickey"`
	CreatedAt string `json:"created_at"`
}

// EVOPermissions 定义了 EVO 权限的数据结构
type EVOPermissions struct {
	UserID        int    `json:"user_id"`
	Plan          string `json:"plan"`
	MaxTime       int    `json:"max_time"`
	AllowPackages string `json:"allow_packages"`
}

// UserInfo 定义了用户信息的详细数据结构
type UserInfo struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Credit   int    `json:"credit"`
}

// APIClient 管理与 API 的通信。
type APIClient struct {
	BaseURL    string
	Token      string
	HTTPClient *http.Client
}

// NewClient 创建一个新的 API 客户端。
func NewClient(token string) *APIClient {
	return &APIClient{
		BaseURL: baseURL,
		Token:   token,
		HTTPClient: &http.Client{
			Timeout: time.Minute,
		},
	}
}

// newRequest 创建一个 HTTP 请求，并设置认证头。
func (c *APIClient) newRequest(method, urlStr string, body io.Reader) (*http.Request, error) {
	req, err := http.NewRequest(method, urlStr, body)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Bearer "+c.Token)
	return req, nil
}

// do 执行一个 HTTP 请求并返回响应体。
func (c *APIClient) do(req *http.Request) ([]byte, error) {
	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("API 错误：状态码 %d, 响应体: %s", res.StatusCode, string(body))
	}

	return body, nil
}

// getRequest 是一个用于发起 GET 请求的辅助函数。
func (c *APIClient) getRequest(endpoint string) ([]byte, error) {
	req, err := c.newRequest("GET", c.BaseURL+endpoint, nil)
	if err != nil {
		fmt.Printf("创建请求时出错: %v\n", err)
		return nil, err
	}

	body, err := c.do(req)
	if err != nil {
		fmt.Printf("执行请求时出错: %v\n", err)
		return nil, err
	}
	return body, nil
}

// multipartPostRequest 是一个用于发起 multipart/form-data POST 请求的辅助函数。
func (c *APIClient) multipartPostRequest(endpoint string, params map[string]string) ([]byte, error) {
	payload := &bytes.Buffer{}
	writer := multipart.NewWriter(payload)
	for key, val := range params {
		_ = writer.WriteField(key, val)
	}
	if err := writer.Close(); err != nil {
		fmt.Printf("关闭写入器时出错: %v\n", err)
		return nil, err
	}

	req, err := c.newRequest("POST", c.BaseURL+endpoint, payload)
	if err != nil {
		fmt.Printf("创建请求时出错: %v\n", err)
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	body, err := c.do(req)
	if err != nil {
		fmt.Printf("执行请求时出错: %v\n", err)
		return nil, err
	}
	return body, nil
}

// --- API 方法 ---

// --- 美化输出函数 ---

func printInstances(instances []Instance) {
	if len(instances) == 0 {
		fmt.Println("未找到任何实例。")
		return
	}
	fmt.Println("--- 实例列表 ---")
	for _, inst := range instances {
		fmt.Printf("ID: %d | 主机名: %s | IPv4: %s | 状态: %s\n", inst.ID, inst.Hostname, inst.IPv4, inst.Status)
		fmt.Printf("  配置: %d CPU / %dMB RAM / %sGB %s\n", inst.CPU, inst.Memory, inst.Disk, inst.DiskType)
		fmt.Printf("  系统: %s | 位置: %s\n", inst.OS, inst.Region)
		fmt.Printf("  密码: %s\n", inst.Password)
		fmt.Printf("  到期时间: %s\n", inst.ExpirationAt)
		fmt.Println("--------------------")
	}
}

func printDeployResponse(resp DeployResponse) {
	fmt.Println("--- 实例部署成功 ---")
	fmt.Printf("ID: %s\n", resp.ID)
	fmt.Printf("主机名: %s\n", resp.Hostname)
	fmt.Printf("IPv4: %s\n", resp.IPv4)
	fmt.Printf("IPv6: %s\n", resp.IPv6)
	fmt.Printf("密码: %s\n", resp.Password)
	fmt.Println("--------------------")
}

func printSimpleResponse(msg string) {
	fmt.Printf("操作成功: %s\n", msg)
}

func printRebuildResponse(resp RebuildResponse) {
	fmt.Println("--- 实例重建成功 ---")
	fmt.Printf("主机名: %s\n", resp.Hostname)
	fmt.Printf("IPv4: %s\n", resp.IPv4)
	fmt.Printf("IPv6: %s\n", resp.IPv6)
	fmt.Printf("新密码: %s\n", resp.Password)
	fmt.Println("--------------------")
}

func printPlans(plans []Plan) {
	if len(plans) == 0 {
		fmt.Println("未找到任何可用方案。")
		return
	}
	fmt.Println("--- 可用方案列表 ---")
	for _, plan := range plans {
		fmt.Printf("ID: %d | 名称: %s | 库存: %d\n", plan.ID, plan.Name, plan.Stock)
		fmt.Printf("  配置: %d CPU / %dMB RAM / %dGB Disk\n", plan.CPU, plan.Memory, plan.Disk)
		fmt.Printf("  网络: %s\n", plan.NetworkSpeed)
		fmt.Println("  可用操作系统:")
		for _, group := range plan.OSGroups {
			fmt.Printf("    - %s:\n", group.GroupName)
			for _, os := range group.OSList {
				fmt.Printf("      ID: %d, 名称: %s\n", os.ID, os.Name)
			}
		}
		fmt.Println("--------------------")
	}
}

func printOSGroups(groups []OSGroup) {
	if len(groups) == 0 {
		fmt.Println("未找到任何可用操作系统。")
		return
	}
	fmt.Println("--- 可用操作系统 ---")
	for _, group := range groups {
		fmt.Printf("- %s:\n", group.GroupName)
		for _, os := range group.OSList {
			fmt.Printf("  ID: %d, 名称: %s\n", os.ID, os.Name)
		}
	}
	fmt.Println("--------------------")
}

func printRenewalResponse(resp RenewalResponse) {
	fmt.Println("--- 实例续订成功 ---")
	fmt.Printf("新到期时间: %s\n", resp.ExpirationAt)
	fmt.Printf("增加时长: %s 小时\n", resp.AddedHours)
	fmt.Printf("总服务时长: %d 小时\n", resp.TotalServiceHours)
	fmt.Println("--------------------")
}

func printStateResponse(resp StateResponse) {
	fmt.Println("--- 实例状态信息 ---")
	fmt.Printf("名称: %s | 状态: %s | 运行状态: %s\n", resp.Name, resp.Status, resp.State.State)
	fmt.Printf("操作系统: %s (%s)\n", resp.System.Name, resp.System.GroupName)
	fmt.Printf("内存: %.2f / %.2f GB 可用\n", toGB(resp.State.Memory.Available), toGB(resp.State.Memory.Total))
	fmt.Printf("流量 (入/出/总): %.2f / %.2f / %.2f MB\n", toMB(resp.State.Traffic.In), toMB(resp.State.Traffic.Out), toMB(resp.State.Traffic.Total))
	fmt.Println("--------------------")
}

func toGB(kb string) float64 {
	val, _ := strconv.ParseFloat(kb, 64)
	return val / 1024 / 1024
}

func toMB(b int) float64 {
	return float64(b) / 1024 / 1024
}

func printSSHKeys(keys []SSHKey) {
	if len(keys) == 0 {
		fmt.Println("未找到任何 SSH 密钥。")
		return
	}
	fmt.Println("--- SSH 密钥列表 ---")
	for _, key := range keys {
		fmt.Printf("ID: %d | 名称: %s | 创建于: %s\n", key.ID, key.Name, key.CreatedAt)
		fmt.Printf("  公钥: %s...\n", key.PublicKey[:40])
		fmt.Println("--------------------")
	}
}

func printEVOPermissions(perms EVOPermissions) {
	fmt.Println("--- EVO 权限信息 ---")
	fmt.Printf("用户 ID: %d\n", perms.UserID)
	fmt.Printf("当前方案: %s\n", perms.Plan)
	fmt.Printf("最大时长: %d 小时\n", perms.MaxTime)
	fmt.Printf("允许的套餐: %s\n", perms.AllowPackages)
	fmt.Println("--------------------")
}

func printUserInfo(info UserInfo) {
	fmt.Println("--- 用户信息 ---")
	fmt.Printf("ID: %d\n", info.ID)
	fmt.Printf("用户名: %s\n", info.Username)
	fmt.Printf("邮箱: %s\n", info.Email)
	fmt.Printf("余额: %d\n", info.Credit)
	fmt.Println("--------------------")
}

func (c *APIClient) ListInstances() {
	body, err := c.getRequest("/Evo/Instance")
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var instances []Instance
	if err := json.Unmarshal(resp.Data, &instances); err != nil {
		fmt.Printf("解析实例数据时出错: %v\n", err)
		return
	}
	printInstances(instances)
}

func (c *APIClient) DeployInstance(productID, osID, deployTime, sshKey string) {
	params := map[string]string{
		"product_id": productID,
		"os_id":      osID,
		"time":       deployTime,
	}
	if sshKey != "" {
		params["sshKey"] = sshKey
	}
	body, err := c.multipartPostRequest("/Evo/Deploy", params)
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var deployData DeployResponse
	if err := json.Unmarshal(resp.Data, &deployData); err != nil {
		fmt.Printf("解析部署数据时出错: %v\n", err)
		return
	}
	printDeployResponse(deployData)
}

func (c *APIClient) DestroyInstance(id string) {
	body, err := c.multipartPostRequest("/Evo/Destroy", map[string]string{"id": id})
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	printSimpleResponse(resp.Message)
}

func (c *APIClient) PowerInstance(id, action string) {
	params := map[string]string{
		"id":     id,
		"action": action,
	}
	body, err := c.multipartPostRequest("/Evo/Power", params)
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	printSimpleResponse(resp.Message)
}

func (c *APIClient) RebuildInstance(id, os, sshKey string) {
	params := map[string]string{
		"id":     id,
		"os":     os,
		"sshKey": sshKey,
	}
	body, err := c.multipartPostRequest("/Evo/Rebuild", params)
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var rebuildData RebuildResponse
	if err := json.Unmarshal(resp.Data, &rebuildData); err != nil {
		fmt.Printf("解析重建数据时出错: %v\n", err)
		return
	}
	printRebuildResponse(rebuildData)
}

func (c *APIClient) ListPlans() {
	body, err := c.getRequest("/Evo/Plan")
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var plans []Plan
	if err := json.Unmarshal(resp.Data, &plans); err != nil {
		fmt.Printf("解析方案数据时出错: %v\n", err)
		return
	}
	printPlans(plans)
}

func (c *APIClient) GetOSByPlan(planID string) {
	body, err := c.multipartPostRequest("/Evo/getOSByPlan", map[string]string{"plan_id": planID})
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var osGroups []OSGroup
	if err := json.Unmarshal(resp.Data, &osGroups); err != nil {
		fmt.Printf("解析操作系统数据时出错: %v\n", err)
		return
	}
	printOSGroups(osGroups)
}

func (c *APIClient) RenewInstance(id, renewTime string) {
	params := map[string]string{
		"id":   id,
		"time": renewTime,
	}
	body, err := c.multipartPostRequest("/Evo/Renewal", params)
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var renewalData RenewalResponse
	if err := json.Unmarshal(resp.Data, &renewalData); err != nil {
		fmt.Printf("解析续订数据时出错: %v\n", err)
		return
	}
	printRenewalResponse(renewalData)
}

func (c *APIClient) GetInstanceState(id string) {
	body, err := c.multipartPostRequest("/Evo/State", map[string]string{"id": id})
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var stateData StateResponse
	if err := json.Unmarshal(resp.Data, &stateData); err != nil {
		fmt.Printf("解析状态数据时出错: %v\n", err)
		return
	}
	printStateResponse(stateData)
}

func (c *APIClient) ListSSHKeys() {
	body, err := c.getRequest("/User/SSHKey")
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var keys []SSHKey
	if err := json.Unmarshal(resp.Data, &keys); err != nil {
		fmt.Printf("解析 SSH 密钥数据时出错: %v\n", err)
		return
	}
	printSSHKeys(keys)
}

func (c *APIClient) GetEVOPermissions() {
	body, err := c.getRequest("/User/EVOPermissions")
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var perms EVOPermissions
	if err := json.Unmarshal(resp.Data, &perms); err != nil {
		fmt.Printf("解析权限数据时出错: %v\n", err)
		return
	}
	printEVOPermissions(perms)
}

func (c *APIClient) GetUserInfo() {
	body, err := c.getRequest("/User/Info")
	if err != nil {
		return
	}
	var resp APIResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		fmt.Printf("解析响应时出错: %v\n", err)
		return
	}
	var userInfo UserInfo
	if err := json.Unmarshal(resp.Data, &userInfo); err != nil {
		fmt.Printf("解析用户信息数据时出错: %v\n", err)
		return
	}
	printUserInfo(userInfo)
}

// getInput 是一个辅助函数，用于提示用户并获取一行输入。
func getInput(prompt string) string {
	fmt.Print(prompt)
	reader := bufio.NewReader(os.Stdin)
	input, err := reader.ReadString('\n')
	if err != nil {
		fmt.Printf("读取输入时出错: %v\n", err)
		return ""
	}
	return strings.TrimSpace(input)
}

func main() {
	token := flag.String("token", "", "API Bearer Token (可选, 如果未提供将提示输入)")
	flag.Parse()

	apiToken := *token
	if apiToken == "" {
		apiToken = getInput("请输入您的 API Bearer Token（API Client ID:Secret）: ")
	}

	if apiToken == "" {
		fmt.Println("错误: 未提供 API Token")
		os.Exit(1)
	}

	client := NewClient(apiToken)

	for {
		fmt.Println("\n请选择要执行的操作:")
		fmt.Println(" 1. 列出所有实例 (List Instances)")
		fmt.Println(" 2. 部署一个新实例 (Deploy Instance)")
		fmt.Println(" 3. 销毁一个实例 (Destroy Instance)")
		fmt.Println(" 4. 执行电源操作 (Power Action)")
		fmt.Println(" 5. 重建实例 (Rebuild Instance)")
		fmt.Println(" 6. 列出所有可用方案 (List Plans)")
		fmt.Println(" 7. 根据方案获取可用操作系统 (Get OS By Plan)")
		fmt.Println(" 8. 续订实例 (Renew Instance)")
		fmt.Println(" 9. 获取实例状态 (Get Instance State)")
		fmt.Println(" 10. 列出用户 SSH 密钥 (List SSH Keys)")
		fmt.Println(" 11. 获取用户 EVO 权限 (Get EVO Permissions)")
		fmt.Println(" 12. 获取用户信息 (Get User Info)")
		fmt.Println(" 0. 退出程序")

		choiceStr := getInput("\n请输入选项编号: ")
		choice, err := strconv.Atoi(choiceStr)
		if err != nil {
			fmt.Println("错误: 无效的输入，请输入一个数字。")
			continue
		}

		switch choice {
		case 1:
			client.ListInstances()
		case 2:
			productID := getInput("请输入产品 ID: ")
			osID := getInput("请输入操作系统 ID: ")
			deployTime := getInput("请输入时长 (小时): ")
			sshKey := getInput("请输入 SSH 密钥 ID (可选, 按回车键跳过): ")
			client.DeployInstance(productID, osID, deployTime, sshKey)
		case 3:
			instanceID := getInput("请输入要销毁的实例 ID: ")
			client.DestroyInstance(instanceID)
		case 4:
			instanceID := getInput("请输入实例 ID: ")
			action := getInput("请输入电源操作 (boot, shutdown, restart, poweroff): ")
			client.PowerInstance(instanceID, action)
		case 5:
			instanceID := getInput("请输入要重建的实例 ID: ")
			osID := getInput("请输入新的操作系统 ID: ")
			sshKey := getInput("请输入 SSH 密钥 ID: ")
			client.RebuildInstance(instanceID, osID, sshKey)
		case 6:
			client.ListPlans()
		case 7:
			planID := getInput("请输入方案 ID: ")
			client.GetOSByPlan(planID)
		case 8:
			instanceID := getInput("请输入要续订的实例 ID: ")
			renewTime := getInput("请输入续订时长 (小时): ")
			client.RenewInstance(instanceID, renewTime)
		case 9:
			instanceID := getInput("请输入要查询状态的实例 ID: ")
			client.GetInstanceState(instanceID)
		case 10:
			client.ListSSHKeys()
		case 11:
			client.GetEVOPermissions()
		case 12:
			client.GetUserInfo()
		case 0:
			fmt.Println("正在退出程序...")
			return
		default:
			fmt.Printf("错误: 无效的选项 %d\n", choice)
		}
	}
}
