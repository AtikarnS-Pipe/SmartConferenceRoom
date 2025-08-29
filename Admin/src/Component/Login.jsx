import { useEffect} from 'react'

const LoginPage = () => {
  // เช็ค code params
  useEffect(() => {
      window.location.href = `/api1/admin/login`;
      return;
  }, []);
  
  return (
    <div>
      {/* Loading... */}
    </div>
  );
};

export default LoginPage;
