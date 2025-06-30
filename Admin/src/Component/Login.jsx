import { useEffect} from 'react'

const LoginPage = () => {
  // เช็ค code params
  useEffect(() => {
      window.location.href = `/admin/login`;
      return;
  }, []);
  
  return (
    <div>
    </div>
  );
};

export default LoginPage;
