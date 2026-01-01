// src/pages/Admin/UserTab.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Modal, message } from 'antd';
import { adminApi } from '../../api';

const UserTab: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getUsers({ page: 1, size: 100 });
      setData(res.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleStatus = (record: any) => {
    const isBanned = record.status === 0;
    Modal.confirm({
      title: isBanned ? '解封用户?' : '封禁用户?',
      content: `确定要对 ${record.username} 执行此操作吗？`,
      onOk: async () => {
        await adminApi.changeStatus(record.id, isBanned ? 1 : 0);
        message.success('操作成功');
        fetchData();
      },
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username' },
    { title: '状态', dataIndex: 'status', render: (v: number) => <Tag color={v===1?'green':'red'}>{v===1?'正常':'封禁'}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, r: any) => (
        <Button size="small" danger={r.status===1} onClick={() => toggleStatus(r)}>
          {r.status===1 ? '封禁' : '解封'}
        </Button>
      )
    }
  ];

  return <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 500 }} />;
};
export default UserTab;