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
    Icon,
    Image,
    Input,
    Link,
    ButtonGroup,
    PinInput,
    PinInputField,
    Select,
    SelectField,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useContext, useRef, useState, createContext, useEffect } from "react";
import { GlobalStore } from "../../App";
import {motion} from 'framer-motion';
import { CenteredLayout, OTPField } from "../../components";
import { redirect, useNavigate, useSearchParams, useParams, Link as RLink } from "react-router-dom";
import { RiCircleFill, RiCircleLine, RiMailCloseFill, RiMailFill, RiMessage2Line, RiMessage3Line, RiMessageLine } from "react-icons/ri";
import { FcSms, FcVoicemail } from "react-icons/fc";
import { FaGoogle, FaFacebook, FaArrowRight } from "react-icons/fa";
import { RxChatBubble, RxEnvelopeOpen } from "react-icons/rx";
import { jsonifyObject, objectifyJSON } from "../../utils";
import {ArrowRight} from 'lucide-react';
import { auth } from "../../firebase";
import firebase from 'firebase/compat/app';
import BusinessProfile from './BusinessProfile';

export const SignupContext = createContext({});

export const SignupView = ({...props }) => {
    const {redirect, axios, notify, onError} = useContext(GlobalStore)
    const [params] = useSearchParams();
    const type = params.get('type') || 'customer'
    const [step, setStepValue] = useState(0);
    const [payload, setPayload] = useState({});
    const [user, setUser] = useState(null);
    const [skipConfirmation, setSkipStep] = useState({
        profile: false,
        email: false,
        phone_number: true,
    });
    const [verification, setVerification] = useState('email');
    const [userProvider, setUserProvider] = useState('email'); // email | google | facebook
    const [user_type, setUserType] = useState(type || 'customer');

    const context = {
        nextStep,
        gotoStep,
        addToPayload: onSubmit,
        payload,
        userProvider,
        setUserProvider,
        user_type,
        setUserType,
        createAccount,
        checkEmail,
    }

    const signUpWithGoogle = async () => {
        try{
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);

            // The signed-in user info.
            const _user = result.user;
            let [first_name, last_name] = _user.displayName.split(" ");
            const data = {
                email: _user.email,
                first_name,
                last_name,
                provider: 'google',
            };

            const newUser = await checkEmail(_user.email);

            if (newUser){
                await setPayload({...data});
                await setUser(user);
                setSkipStep({...skipConfirmation, email: true});
                nextStep();
            }
        }catch(error){
            console.error("Signup with google error", error);
        }
    };

    const steps = [
        {
            title: `Create ${type === 'business'? 'a business' : 'your'} account`,
            description: 'Start your 30-day free trial', 
            key: 'signup',
            component: <EmailStep type={type} signUpWithGoogle={signUpWithGoogle} />
        },
        {
            title: 'Create your account',
            description: 'Start your 30-day free trial', 
            key: 'profile',
            component: <SignupStep type={type} />
        },
        // {
        //     title: 'Confirm your email',
        //     description: 'Verify your email to get notifications and updates from Motaa.',
        //     key: 'email',
        //     component: <ConfirmationStep type={type} verification={'email'}  />
        // },
    ]

    function nextStep(){
        setStepValue((step+1))
    }

    function gotoStep(num){
        setStepValue(num)
    }
    
    function onSubmit(data){
        // if (verification === 'email' && skipConfirmation?.email){
        //     return createAccount(data)
        // }
        setPayload({
            ...payload,
            ...data
        });
    }

    function handleEmailSubmission(data){

    }

    async function checkEmail(email){
        try{
            const res = await axios.get(`/accounts/register/?email=${email}`);
            const data = objectifyJSON(res.data);
            if (res.status === 200){
                return true;
            }else{
                notify({
                    title: 'Error!',
                    body: data.message,
                    color: 'red',
                })
                return false;
            }
        }catch(err){
            notify({
                title: 'An error occurred!',
                body: err.message
            })
        }
    }

    async function createAccount(formData){
        onSubmit(formData);
    }

    const StepComponent = ({ props }) => {
        const currentStep = steps[step];

        useEffect(() => {
            if (skipConfirmation[`${currentStep.key}`]){
                nextStep();
            }
        }, [])
        return currentStep.component
    }

    return(
        <SignupContext.Provider value={context}>
        <CenteredLayout>
            <Box as={motion.div} style={{ width: '90%', maxWidth: '600px', margin: 'auto', placeSelf: 'center', paddingTop: '3vh', paddingBottom: '5%'}} px={3}>
                <Image src="/assets/images/motaa-logo-3.png" alt="Logo" mb={4} mx={'auto'} width="100px" />
                <Heading textAlign='center' my={4} className="subtitle"> {steps[step].title} </Heading>
                <Text textAlign='center' my={4} className="text"> {steps[step].description} </Text>
                
                <Box>
                    <StepComponent />
                </Box>
            </Box>
        </CenteredLayout>
        </SignupContext.Provider>
    )
}


const EmailStep = ({ signUpWithGoogle }) => {
    const [email, setEmail] = useState('');
    const [params] = useSearchParams();
    const type = params.get('type') || 'customer'
    const [password, setPassword] = useState('');
    const {axios, notify, onError} = useContext(GlobalStore);
    const {checkEmail, user_type, addToPayload, setUserType, payload, nextStep} = useContext(SignupContext);

    async function handleSubmit(e){
        e.preventDefault();
        try{
            const canProceed = await checkEmail(email);
            if (canProceed){
                if (type === 'business' && ['dealer', 'mechanic'].includes(user_type)){
        
                }else if (type === 'personal'){
                    setUserType('customer');
                }else{
                    throw new Error("Please select a business type!" + ' that matches ' + type);
                }
                addToPayload({
                    email,
                    password,
                    provider: 'motaa'
                });
                nextStep();
            }
        }catch(err){
            notify({
                title: 'Error!',
                color: 'red',
                body: err.message
            })
        }
    }

    return(
        <Box>
            <form onSubmit={handleSubmit} method="post" name="sign-up-form">
                {type === 'business' && 
                <Box textAlign="center" my={2}>
                    <FormLabel textAlign="center"> Select your business type </FormLabel>
                    <ButtonGroup isAttached mx="auto">
                        <Button
                         fontSize="sm"
                         rounded="lg"
                         variant={user_type === 'dealer' ? 'block' : 'outline'}
                         bgColor={user_type === 'dealer' ? 'primary' : 'transparent'}
                         color={user_type === 'dealer' ? 'white' : 'black'}
                         onClick={() => setUserType('dealer')}
                        > Car Dealer </Button>
                        <Button
                         fontSize="sm"
                         rounded="lg"
                         variant={user_type === 'mechanic' ? 'block' : 'outline'}
                         bgColor={user_type === 'mechanic' ? 'primary' : 'transparent'}
                         color={user_type === 'mechanic' ? 'white' : 'black'}
                         onClick={() => setUserType('mechanic')}
                        > Mechanic </Button>
                    </ButtonGroup>
                    </Box>
                }

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
                        <Button py={6} type="submit" w={'100%'} colorScheme="blue" bg={'primary'}> Get Started  </Button>
                    </FormControl>
                </Stack>
            
                <HStack my={5}>
                    <Divider />
                    <Heading size={'sm'} color={'grey'}> OR </Heading>
                    <Divider />
                </HStack>

                <Stack flex={1} columnGap={4} rowGap={4} my={3}>
                    <Button disabled={type === 'business' && !['dealer', 'mechanic'].includes(user_type)} w={'100%'} variant="outline" borderColor="lightgrey" rounded="lg" onClick={signUpWithGoogle} leftIcon={<FaGoogle />} colorScheme="white" color={'secondary'} bg={'white'}> Sign up with Google </Button>
                </Stack>

                <Divider my={3} />
                <RLink to={`/signup/?type=${type !== 'business' ? 'business' : 'customer'}`}>
                    <Button py={5} rightIcon={<FaArrowRight />} colorScheme="blue" variant="outline" borderWidth={3} borderColor="primary" w={"100%"} rounded="lg"> Create {type === 'business' ? 'Personal' : 'Business'} Account </Button>
                </RLink>
            </form>
        </Box>
    )
}


const SignupStep = ({ type }) => {
    const {axios, notify, onAuthenticated} = useContext(GlobalStore);
    const {payload, addToPayload, nextStep, user_type, gotoStep} = useContext(SignupContext);
    const [first_name, setFirstName] = useState(payload?.first_name);
    const [last_name, setLastName] = useState(payload?.last_name);
    const [phone_number, setPhoneNumber] = useState('');
    const [cac_number, setCACNumber] = useState('');
    const [id_type, setIdType] = useState('nin');
    const redirect = useNavigate();

    async function handleSubmit(e){ 
        e.preventDefault();

        const newPayload = {
            ...payload,
            cac_number,
            first_name,
            last_name,
            phone_number,
            action: 'create-account',
            id_type,
            user_type
        }

        try{
            addToPayload({ ...newPayload });

            const res = await axios.post('/accounts/register/', JSON.stringify(newPayload));
            const data = objectifyJSON(res.data)

            if (res.status === 201){
                localStorage.setItem('motaa-auth-user', jsonifyObject(data.data));
                notify({
                    title: 'Success',
                    body: "Successfully created your account"
                });

                if (type === 'business'){
                    return redirect('/signup/business/')
                }
                onAuthenticated({ ...auth })
                redirect('/home');

                // REMOVED BECAUSE OTP BREAKS

                // if (payload.provider === 'google'){ // skip email confirmation
                //     if(type === 'business'){
                //         return redirect('/signup/business/');
                //     }else{
                //         return redirect('/');
                //     }
                // }else{
                //     return nextStep();
                // }
            }else{
                console.log("Signup Error", data)
                notify({
                    title: 'Sign up Error!',
                    color: 'red',
                    body: data.message,
                })
            }
        }catch(error){
            notify({
                title: 'Error!',
                color: 'red',
                body: error.message,
            })
        }
    }

    return(
        <form onSubmit={handleSubmit} method="post">
            <Flex justifyContent={'space-between'} columnGap={3} flexWrap={{base: 'wrap', md: 'nowrap'}}>
                <FormControl width={{ base: '100%', md: '50%' }} my={2}>
                    <FormLabel> First name </FormLabel>
                    <Input
                        onInput={e => setFirstName(e.target.value)}
                        value={first_name}
                        placeholder="John"
                    />
                </FormControl>

                <FormControl width={{ base: '100%', md: '50%' }} my={2}>
                    <FormLabel> Last name </FormLabel>
                    <Input
                        onInput={e => setLastName(e.target.value)}
                        value={last_name}
                        placeholder="Doe"
                    />
                </FormControl>
            </Flex>

            <Flex justifyContent={'space-between'} columnGap={3} flexWrap={{base: 'wrap', md: 'nowrap'}}>
                <FormControl width={{ base: '100%', md: '50%' }} my={2}>
                    <FormLabel> Phone number </FormLabel>
                    <Input
                        onInput={e => setPhoneNumber(e.target.value)}
                        value={phone_number} type="tel"
                        placeholder="+234 812 4128 234"
                    />
                </FormControl>
            </Flex>

            <FormControl mt={3}>
                <Button type="submit" w={'100%'} colorScheme="blue" bg={'primary'}> Continue </Button>
            </FormControl>
        </form>
    )
}


const ConfirmationStep = ({ verification, type }) => {
    const {axios, notify, onAuthenticated} = useContext(GlobalStore);
    const {nextStep, payload} = useContext(SignupContext);
    const [otp, setOTP] = useState('');
    const [timeout, setCodeTimer] = useState(0);
    const timer = useRef();
    const redirect = useNavigate();

    async function requestCode(){
        timer.current.innerHTML = `Request new code in 60s`;
        let time = 60;
        const auth = objectifyJSON(localStorage.getItem('motaa-auth-user'))
        const token = auth.token

        const counter = setInterval(() => {
            if (time > 0){
                time -= 1
                timer.current.innerHTML = `Request new code in ${time}s`;
                setCodeTimer(time);
            }else{
                timer.current.innerHTML = `Click to resend`;
                return clearInterval(counter)
            }
        }, 1000);
        
        const res = await axios.post('/accounts/verify-email/', JSON.stringify({
            action: 'request-code',
            email: payload.email,
        }), {
            headers: {
                // 'User-Agent': `${document.location.hostname}`,
                'Authorization': `Token ${token}`
            }
        })
    }
    
    async function verifyCode(){
        const auth = objectifyJSON(localStorage.getItem('motaa-auth-user'));
        const token = auth.token
        timer.current.focus()
        
        if (verification === 'email'){
            const res = await axios.post('/accounts/verify-email/', JSON.stringify({
                action: 'confirm-code',
                email: payload.email,
                code: otp
            }), {
                headers: {
                    'Authorization': `Token ${token}`
                }
            })
            
            if (res.status === 200){
                setOTP('');
                notify({
                    title: "Success",
                    body: "Your email has been verified"
                });

                if (type === 'business'){
                    return redirect('/signup/business/')
                }
                onAuthenticated({ ...auth })
                redirect('/home');
            }
        }
    }

    return(
        <Box flex={1} textAlign={'center'}>
            <Card my={5} py={5} px={5} width={'max-content'} mx={'auto'}>
                <Icon className="icon" color={'primary'} my={3} mx={'auto'}> {verification === 'email' ? <RxEnvelopeOpen /> : <RiMessage3Line /> }</Icon>
                <Heading className="subtitle" size={'md'} mb={3}> Please check your {verification === 'email' ? 'inbox' : 'messages'}. </Heading>
                <Text className="small-text" size={'xs'}> We've sent a code to {verification === 'email' ? `${payload?.email}` : `${payload?.phone_number}`} </Text>

                <OTPField value={otp} onChange={val => setOTP(val)} />

                <Text className="small-text" size={'xs'}>
                    Didn't get a code?
                    <Button
                     textDecor={'underline'}
                     bg={'transparent'}
                     _hover={{ bg: 'transparent'}}
                     disabled={timeout > 0}
                     px={1}
                     onClick={requestCode}
                    > <span ref={timer}>Click to resend</span> </Button>
                </Text>

                {/*<dojah-button
                  widgetId="undefined"
                  text="Web"
                  textColor="#FFFFFF"
                  backgroundColor="#3977de">
                </dojah-button>*/}

                <Button my={5} onClick={verifyCode} disabled={!otp} type="submit" w={'100%'} colorScheme="blue" bg={'primary'}> Verify code </Button>
            </Card>
        </Box>
    )
}


const PhoneConfirmationStep = ({ nextStep, payload }) => {
    const [otp, setOTP] = useState('');
    const [timeout, setCodeTimer] = useState(0);
    const timer = useRef();
    const [verification, setVerification] = useState('email') // email | sms

    async function requestCode(){
        let time = 60;

        const counter = setInterval(() => {
            if (time > 0){
                time -= 1
                timer.current.innerHTML = `Request new code in ${time}s`;
                setCodeTimer(time);
            }else{
                timer.current.innerHTML = `Click to resend`;
                return clearInterval(counter)
            }
        }, 1000);
        timer.current.innerHTML = `Request new code in ${time}s`;

    }

    function verifyCode(){
        console.log("OTP:", otp);
        console.log("Payload:", payload);
        setOTP('');
        timer.current.focus()
        if (verification === 'email'){
            setVerification('sms')
        }
    }

    return(
        <Box flex={1} textAlign={'center'}>
            <Card my={5} py={5} px={5} width={'max-content'} mx={'auto'}>
                <Icon className="icon" color={'primary'} my={3} mx={'auto'}> {verification === 'email' ? <RxEnvelopeOpen /> : <RiMessage3Line /> }</Icon>
                <Heading className="subtitle" size={'md'} mb={3}> Please check your {verification === 'email' ? 'inbox' : 'messages'}. </Heading>
                <Text className="small-text" size={'xs'}> We've sent a code to {verification === 'email' ? `${payload.email}` : `${payload.phone_number}`} </Text>

                <OTPField value={otp} onChange={val => setOTP(val)} />

                <Text className="small-text" size={'xs'}>
                    Didn't get a code?
                    <Button
                     textDecor={'underline'}
                     bg={'transparent'}
                     _hover={{ bg: 'transparent'}}
                     disabled={timeout > 0}
                     px={1}
                     onClick={requestCode}
                    > <span ref={timer}>Click to resend</span> </Button>
                </Text>

                <Button my={5} onClick={verifyCode} disabled={!otp} type="submit" w={'100%'} colorScheme="blue" bg={'primary'}> Verify code </Button>
            </Card>
        </Box>
    )
}

export default SignupView;
