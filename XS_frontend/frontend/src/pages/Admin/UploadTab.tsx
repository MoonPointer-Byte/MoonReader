// src/pages/Admin/UploadTab.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Card } from 'antd';
import { UploadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { adminApi } from '../../api';

const UploadTab: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const onFinish = async (values: any) => {
    if (fileList.length === 0) {
      message.error('请选择 TXT 文件');
      return;
    }
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('author', values.author);
    formData.append('file', fileList[0]);

    setLoading(true);
    try {
      await adminApi.uploadNovel(formData);
      message.success('小说上传成功！');
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="上传小说" bordered={false}>
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 500 }}>
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input placeholder="输入小说标题" />
        </Form.Item>
        <Form.Item name="author" label="作者" rules={[{ required: true }]}>
          <Input placeholder="输入作者名" />
        </Form.Item>
        <Form.Item label="文件 (.txt)">
          <Upload 
            maxCount={1}
            beforeUpload={(file) => {
              if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
                message.error('只能上传 TXT');
                return Upload.LIST_IGNORE;
              }
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
            fileList={fileList}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} icon={<CloudUploadOutlined />}>
            开始上传
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
export default UploadTab;