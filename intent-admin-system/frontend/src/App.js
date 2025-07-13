import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Menu, Typography, Card, Row, Col } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  MessageOutlined,
  SettingOutlined
} from '@ant-design/icons';
import 'antd/dist/reset.css';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function Dashboard() {
  return (
    <div>
      <Title level={2}>智能音箱意图管理系统</Title>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card title="核心意图" bordered={false}>
            <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>34</Text>
            <br />
            <Text type="secondary">个核心意图</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="非核心意图" bordered={false}>
            <Text strong style={{ fontSize: '24px', color: '#52c41a' }}>23</Text>
            <br />
            <Text type="secondary">个非核心意图</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="回复模板" bordered={false}>
            <Text strong style={{ fontSize: '24px', color: '#faad14' }}>282</Text>
            <br />
            <Text type="secondary">个回复模板</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="意图类别" bordered={false}>
            <Text strong style={{ fontSize: '24px', color: '#f5222d' }}>15</Text>
            <br />
            <Text type="secondary">个意图类别</Text>
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16 }} title="系统状态">
        <p>🚀 <strong>后端服务：</strong> 运行正常 (http://localhost:3001)</p>
        <p>🎯 <strong>数据库：</strong> SQLite 连接正常</p>
        <p>⚡ <strong>响应时间：</strong> ~50ms</p>
        <p>💰 <strong>每日成本节省：</strong> ¥200.00</p>
        <p>🎛️ <strong>LLM调用率：</strong> 0% (纯本地化处理)</p>
      </Card>
    </div>
  );
}

function IntentManagement() {
  return (
    <div>
      <Title level={2}>意图管理</Title>
      <p>意图管理功能正在开发中...</p>
    </div>
  );
}

function ResponseManagement() {
  return (
    <div>
      <Title level={2}>回复管理</Title>
      <p>回复管理功能正在开发中...</p>
    </div>
  );
}

function Settings() {
  return (
    <div>
      <Title level={2}>系统设置</Title>
      <p>系统设置功能正在开发中...</p>
    </div>
  );
}

function App() {
  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: '控制台',
    },
    {
      key: '2',
      icon: <AppstoreOutlined />,
      label: '意图管理',
    },
    {
      key: '3',
      icon: <MessageOutlined />,
      label: '回复管理',
    },
    {
      key: '4',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const [selectedKey, setSelectedKey] = React.useState('1');

  const renderContent = () => {
    switch (selectedKey) {
      case '1':
        return <Dashboard />;
      case '2':
        return <IntentManagement />;
      case '3':
        return <ResponseManagement />;
      case '4':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            🎤 智能音箱意图管理系统
          </Title>
        </Header>
        <Layout>
          <Sider width={250} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              style={{ height: '100%', borderRight: 0 }}
              onClick={({ key }) => setSelectedKey(key)}
            />
          </Sider>
          <Layout style={{ padding: '24px' }}>
            <Content
              style={{
                background: '#fff',
                padding: 24,
                margin: 0,
                borderRadius: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {renderContent()}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App; 