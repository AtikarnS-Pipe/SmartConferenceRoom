import { useEffect} from 'react'

const LoginPage = () => {
  // เช็ค code params
  useEffect(() => {
    const code = new URLSearchParams(location.search).get("code");
    if (!code) {
      window.location.href = `/admin/login`;
      return;
    }
  }, []);
  
  return (
    <div>
      {/* Loading... */}
    </div>
  );
};

export default LoginPage;
