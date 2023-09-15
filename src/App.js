import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Layout } from 'antd';  // Importing layout components from Ant Design
import HomePage from './pages/HomePage'; // or './components/HomePage'
import './App.css';

const { Header, Content, Footer } = Layout;  // Destructuring layout components

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ color: 'white', textAlign: 'center', fontSize: '24px' }}>
          App Name  {/* This can be the name or logo of your app */}
        </Header>
        <Content style={{ padding: '20px 50px' }}>
          <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* other routes can be added below */}
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Footer Information</Footer> {/* This can be a footer text or copyright information */}
      </Layout>
    </Router>
  );
}

export default App;
