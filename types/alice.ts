// Alice API 类型定义

export interface APIResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
}

export interface Instance {
  id: number;
  uid: string;
  ipv4: string;
  ipv6: string;
  hostname: string;
  cpu: number;
  cpu_name: string;
  memory: number;
  disk: string;
  disk_type: string;
  user: string;
  password: string;
  status: string;
  creation_at: string;
  expiration_at: string;
  plan: string;
  region: string;
  os: string;
  show_speed: string;
}

export interface DeployResponse {
  id: string;
  password: string;
  ipv4: string;
  ipv6: string;
  hostname: string;
}

export interface RebuildResponse {
  ipv4: string;
  ipv6: string;
  hostname: string;
  password: string;
}

export interface OS {
  id: number;
  name: string;
}

export interface OSGroup {
  group_name: string;
  os_list: OS[];
}

export interface Plan {
  id: number;
  name: string;
  stock: number;
  cpu: number;
  memory: number;
  disk: number;
  network_speed: string;
  os: OSGroup[];
}

export interface RenewalResponse {
  expiration_at: string;
  added_hours: string;
  total_service_hours: number;
}

export interface StateResponse {
  name: string;
  status: string;
  state: {
    memory: {
      memtotal: string;
      memfree: string;
      memavailable: string;
    };
    cpu: number;
    state: string;
    traffic: {
      in: number;
      out: number;
      total: number;
    };
  };
  system: {
    name: string;
    group_name: string;
  };
}

export interface SSHKey {
  id: number;
  name: string;
  publickey: string;
  created_at: string;
}

export interface EVOPermissions {
  user_id: number;
  plan: string;
  max_time: number;
  allow_packages: string;
}

export interface UserInfo {
  id: number;
  email: string;
  username: string;
  credit: number;
}

export interface DeployParams {
  product_id: string;
  os_id: string;
  time: string;
  sshKey?: string;
  bootScript?: string;
}

export interface PowerParams {
  id: string;
  action: 'boot' | 'shutdown' | 'restart' | 'poweroff';
}

export interface RebuildParams {
  id: string;
  os: string;
  sshKey?: string;
  bootScript?: string;
}

export interface RenewalParams {
  id: string;
  time: string;
}
