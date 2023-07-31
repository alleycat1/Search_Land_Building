import { useState } from 'react';
import axios from 'axios';

export default function Index() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/login', { username, password });
      if (response.status === 200) {
        window.location.href = '/main'; // ログイン成功時のページ遷移
      }
    } catch (error) {
      alert('Invalid username or password');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Username:
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password:
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button type="submit">Login</button>
    </form>
  );
}
