## 前端发布工具

- 发布工具

- 原理：根据 git 仓库所运行的`流水线`，获取`流水线`配置的参数，将构建完的产物，根据参数上传至指定 `OSS` 对应的 `bucket`。

#### 安装

```js
npm i @jonce/def-cli -D
```

#### 使用

- 发日常

```js
def pub -d
```

- 发正式

```js
def pub -o
```

### 脚本主要流程
* development: 拉取远程同名分支（云构建忽略）-> 上传至 OSS
* production：确认远程有同名分支（云构建忽略）-> 确认代码已提交（云构建忽略）-> 拉取并合并 master 分支 -> 创建 tag 标签 -> 上传至 OSS -> (流水线会将当前分支合并到 master 分支上去)
 

### 本地发布日常测试 

本地没有构建的参数，手动注入环境变量中.
OSS 用的阿里云的，本地最好使用子账号accessKey和accessKeySecret

```
bucket=19ba region=cn-hangzhou accessKeyId=xxx accessKeySecret=xxxx cdnPath=https://19ba.oss-cn-hangzhou.aliyuncs.com/ def pub -d 
```


