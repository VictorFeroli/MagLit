import TopRightButtons from "../components/home/TopRightButtons";
import { toast, ToastContainer } from "react-toastify";
import PasswordForm from "../components/home/PasswordForm";
import { navbarState } from "../atoms/navbarAtom";
import { BsFillGridFill } from "react-icons/bs";
import { useSwipeable } from "react-swipeable";
import MainLogo from "../components/home/MainLogo";
import { BASE_URL } from "../utils/config";
import { useRouter } from "next/router";
import { useRecoilState } from "recoil";
import { useState } from "react";
import axios from "axios";

const RedirectPage = ({ slug }) => {
  const [navbarOpen, setNavbarOpen] = useRecoilState(navbarState);
  const handlers = useSwipeable({
    onSwipedLeft: (e) => {
      setNavbarOpen(true);
    },
  });

  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios
      .post(BASE_URL + "/api/verify", { slug, password })
      .then((response) => {
        router.push(response.data.linkData.link);
      })
      .catch((error) => {
        toast.error("Wrong Password");
      });
  };

  return (
    <div
      className={`${
        navbarOpen ? "scale-90 blur-lg" : "scale-100 blur-none"
      } animate flex h-screen flex-col items-center justify-center gap-y-10 overflow-hidden bg-slate-50 dark:bg-stone-900`}
    >
      <TopRightButtons
        navbarOpen={navbarOpen}
        setNavbarOpen={setNavbarOpen}
        cardsOpen={false}
      />

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        theme="colored"
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={2}
      />

      <div className="flex w-full flex-col items-center justify-center gap-y-10">
        <MainLogo />
        <PasswordForm
          password={password}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default RedirectPage;

export async function getServerSideProps(context) {
  const slug = context.params.slug;
  let responseData = null;
  let isProtected = false;

  // get axios response, verify slug
  await axios
    .post(BASE_URL + "/api/verify", {
      slug: slug,
      password: "",
    })
    .then((response) => {
      // save response data
      responseData = response.data;
      console.log(responseData);
    })
    .catch((error) => {
      // save response data
      responseData = error?.response?.data;
      console.error(responseData);
      // check if link is protected
      isProtected = responseData?.linkData?.protected;
    });

  if (!responseData) {
    return {
      notFound: true,
    };
  }
  if (responseData?.linkData?.link?.length < 1) {
    return {
      notFound: true,
    };
  }

  // if link is protected, input password
  if (isProtected) {
    context.res.setHeader("Cache-Control", "s-maxage=86400");
    return {
      props: {
        slug,
      },
    };
  } else {
    // if link isn't protected, redirect
    context.res.setHeader("Cache-Control", "s-maxage=86400");
    return {
      redirect: {
        destination: responseData.linkData.link,
        permanent: false,
      },
    };
  }
}
