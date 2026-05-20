import React from 'react';
import { Layout, Menu } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Sider } = Layout;

interface SearchSidebarProps {
  active: boolean;
  onClick: () => void;
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({ active, onClick }) => {
  return (
    <Sider
      theme="light"
      width={72} 
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: '1px solid #dbdbdb',
        padding: '24px 0',
      }}
    >
      <Menu
        mode="inline"
        selectable={false}
        onClick={onClick}
        selectedKeys={active ? ['search'] : []}
        style={{ borderRight: 'none' }}
        items={[
          {
            key: 'search',
            icon: <SearchOutlined style={{ fontSize: '24px' }} />,
            label: '', 
          },
        ]}
      />
    </Sider>
  );
};

export default SearchSidebar;