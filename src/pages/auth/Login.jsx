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
import { CenteredLayout, TwoFactorPinForm } from "../../components";
import { useNavigate } from "react-router-dom";

export const LoginView = ({ ...props }) => {
    const self = this;

    const {onAuthenticated, axios, notify,} = useContext(GlobalStore)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRemeberMe] = useState(false);
    const redirect = useNavigate();

    async function handleLogin(e){
        e.preventDefault();
        try{
            const res = await axios.post('/accounts/login/', JSON.stringify({
                email,
                password
            }));
            const data = await JSON.parse(res.data);

            if (res.status === 200){
                onAuthenticated(data)
                notify({
                    'title': 'Success',
                    'body': 'Successfully logged in!'
                });
                return redirect(`/buy?user=${data.email}`, 200)
            }else{
                return onError(data?.message, true)
            }
        }catch(error){
            return onError(error.message)
        }
    }
    
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
                            <Button w={'100%'} colorScheme="white" color={'secondary'} variant={'outline'}> Log in with Google </Button>
                            <Button w={'100%'} colorScheme="blue" bg={'primary'}> Log in with Facebook </Button>
                        </Stack>

                    </form>
                </Box>
            </Box>
        </CenteredLayout>
    )

    // return(
    //     <TwoFactorPinForm />
    // )
}


export default LoginView;
