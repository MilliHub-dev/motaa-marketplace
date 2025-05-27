import {
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Image,
    Input,
    Stack,
    Text
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { GlobalStore } from "../../App";
import {motion} from 'framer-motion';
import { FaGoogle, FaFacebook, FaArrowRight } from "react-icons/fa";
import { CenteredLayout } from "../../components";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import firebase from 'firebase/compat/app';

export const LoginView = ({ ...props }) => {
    const self = this;

    const {onAuthenticated, axios, notify,} = useContext(GlobalStore)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [provider, setProvider] = useState('motaa');
    const [rememberMe, setRemeberMe] = useState(false);
    const redirect = useNavigate();

    async function handleLogin(e){
        e.preventDefault();

        try{
            const res = await axios.post('/accounts/login/', JSON.stringify({
                email,
                password,
                provider,
            }));
            const data = await JSON.parse(res.data);

            if (res.status === 200 && !data?.error){
                onAuthenticated(data)
                notify({
                    'title': 'Success',
                    'body': `Successfully logged in! Welcome back ${data?.user_type}`
                });

                switch(data?.user_type){
                    case 'dealer': return redirect('/dashboard', 200);
                    case 'mechanic': return redirect('/dashboard', 200);
                    default: return redirect(`/home?user=${data.email}`, 200);
                }                
            }else{
                return onError(data?.message, true)
            }
        }catch(error){
            return onError(error.message)
        }
    }

    const signInWithGoogle = async () => {
        try{
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);

            // The signed-in user info.
            const user = result.user;
            if (user){
                const res = await axios.post('/accounts/login/', JSON.stringify({
                    provider: 'google',
                    email: user.email,
                    password: ''
                })
                );
                const data = await JSON.parse(res.data);

                if (res.status === 200 && !data?.error){
                    onAuthenticated(data)
                    notify({
                        'title': 'Success',
                        'body': `Successfully logged in! Welcome back ${data?.user_type}`
                    });

                    switch(data?.user_type){
                        case 'dealer': return redirect('/dashboard', 200);
                        case 'mechanic': return redirect('/dashboard', 200);
                        default: return redirect(`/home?user=${data.email}`, 200);
                    }                
                }else{
                    return onError(data?.message, true)
                }

            }
        }catch(error){
            console.error("Signup with google error", error);
        }
    };
    
    function onError(message, reload=false){
        notify({
            'title': 'Error!',
            'body': message || 'Something went wrong!',
            'color': 'red'
        });
        if (reload){
            refresh();
        }
    }
    
    function refresh(){
        setEmail('');
        setPassword('');
        setProvider('motaa');
        setRemeberMe(false);
    }

    return(
        <CenteredLayout py={'2rem'}>
            <Box as={motion.div} style={{ width: '90%', maxWidth: '600px', margin: 'auto', placeSelf: 'center', paddingTop: '3vh', paddingBottom: '5%'}} px={3}>
                <Image src="/assets/images/motaa-logo-3.png" alt="Logo" mb={4} mx={'auto'} width="100px" />
                <Heading textAlign='center' my={4} className="subtitle"> Welcome back </Heading>
                <Text textAlign='center' my={4} className="text"> Log back in to your account. </Text>
                
                <Box>
                    <form onSubmit={handleLogin} method="post" name="sign-up-form">

                        <Stack flex={1}>
                            <FormControl name={'email'} my={2} isRequired>
                                <FormLabel> Email </FormLabel>
                                <Input
                                    type="email"
                                    required={true}
                                    value={email}
                                    name="email"
                                    onInput={e => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                />
                            </FormControl>

                            <FormControl name={'email'} my={2} isRequired>
                                <FormLabel> Password </FormLabel>
                                <Input
                                    type="password"
                                    required={true}
                                    value={password}
                                    name="password"
                                    onInput={e => setPassword(e.target.value)}
                                    placeholder="Enter a password"
                                />
                            </FormControl>

                            <FormControl my={4}>
                                <Button type="submit" w={'100%'} colorScheme="blue" bg={'primary'}> Log in  </Button>
                            </FormControl>
                        </Stack>
                    
                        <HStack my={5}>
                            <Divider />
                            <Heading size={'sm'} color={'grey'}> OR </Heading>
                            <Divider />
                        </HStack>

                        <Stack flex={1} columnGap={4} rowGap={8}>
                            <Button w={'100%'} leftIcon={<FaGoogle />} onClick={signInWithGoogle} colorScheme="white" color={'secondary'} variant={'outline'}> Log in with Google </Button>
                            <Button w={'100%'} variant="outline" borderWidth={'2px'} rightIcon={<FaArrowRight />} colorScheme="blue" borderColor={'primary'}> Log in to Business Account </Button>
                        </Stack>

                    </form>
                </Box>
            </Box>
        </CenteredLayout>
    )
}


export default LoginView;
