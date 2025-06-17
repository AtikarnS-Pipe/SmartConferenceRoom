import { useEffect} from 'react'

const LoginPage = () => {
   useEffect(() => {
        // เช็ค cookie user_token
        const code = new URLSearchParams(location.search).get("code");
        if (!code) {
          window.location.href = `/admin/login`;
          return;
        }
    },[]);
};

export default LoginPage;
