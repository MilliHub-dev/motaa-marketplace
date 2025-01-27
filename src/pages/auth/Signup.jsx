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
import { CenteredLayout, OTPField, TwoFactorPinForm } from "../../components";
import { redirect, useNavigate, useParams, Link as RLink } from "react-router-dom";
import { RiCircleFill, RiCircleLine, RiMailCloseFill, RiMailFill, RiMessage2Line, RiMessage3Line, RiMessageLine } from "react-icons/ri";
import { FcSms, FcVoicemail } from "react-icons/fc";
import { FaGoogle, FaFacebook, FaArrowRight } from "react-icons/fa";
import { RxChatBubble, RxEnvelopeOpen } from "react-icons/rx";
import { jsonifyObject, objectifyJSON } from "../../utils";
import {ArrowRight} from 'lucide-react';
import { auth } from "../../firebase";
import firebase from 'firebase/compat/app';


const SignupContext = createContext({});

export const SignupView = ({ type="personal", ...props }) => {
    const {onAuthenticated, axios, notify, onError} = useContext(GlobalStore)
    const [step, setStepValue] = useState(0);
    const [payload, setPayload] = useState({});
    const [user, setUser] = useState(null);
    const [skipConfirmation, setSkipStep] = useState({email: false, phone_number: false});
    const [verification, setVerification] = useState('email');
    const [userProvider, setUserProvider] = useState('email'); // email | google | facebook
    const [user_type, setUserType] = useState('customer');

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


    const signInWithGoogle = async () => {
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
                setPayload({...data});
                setUser(user);
                setSkipStep({...skipConfirmation, email: true});
                gotoStep(1);
            }
        }catch(error){
            console.error("Signup with google error", error);
        }
    };

    const steps = [
        { title: `Create ${type === 'business'? 'a business' : 'your'} account`,
            description: 'Start your 30-day free trial', 
            component: <EmailStep signInWithGoogle={signInWithGoogle} type={type} />
        },
        { title: 'Create your account',
            description: 'Start your 30-day free trial', 
            component: <SignupStep skipConfirmation={skipConfirmation} />
        },
        { title: 'Confirm your email',
            description: 'Verify your email to get notifications and updates from Motaa.',
            component: <ConfirmationStep verification={verification}  />
        },
        { title: 'Confirm your phone number',
            description: 'Verify your email to get notifications and updates from Motaa.',
            component: <ConfirmationStep verification={verification} nextStep={() => redirect(`/home?welcome=${payload.first_name}`)} />
        },
    ]

    function nextStep(){
        setStepValue((step+1))
    }

    function gotoStep(num){
        setStepValue(num)
    }
    
    function onSubmit(data){
        if (verification === 'email' && skipConfirmation?.email){
            return createAccount(data)
        }
        setPayload({
            ...payload,
            ...data
        });
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
            // return false;
            notify({
                title: 'An error occurred!',
                body: err.message
            })
        }
    }

    async function createAccount(formData){
        onSubmit(formData);

        try{
            // const res = await axios.post('/accounts/register/', {
            //     data: {
            //         ...payload,
            //     }
            // })

            // const data = JSON.parse(res.data)
            // console.log("Got Data:", data)
            console.log("Got Data:", payload)

        }catch(error){

        }
    }

    return(
        <SignupContext.Provider value={context}>
        <CenteredLayout>
            <Box as={motion.div} style={{ width: '90%', maxWidth: '600px', margin: 'auto', placeSelf: 'center', paddingTop: '3vh', paddingBottom: '5%'}} px={3}>
                <Image src="/assets/images/motaa-logo-3.png" alt="Logo" mb={4} mx={'auto'} width="100px" />
                <Heading textAlign='center' my={4} className="subtitle"> {steps[step].title} </Heading>
                <Text textAlign='center' my={4} className="text"> {steps[step].description} </Text>
                
                <Box>
                    {steps[step].component}
                </Box>
            </Box>
        </CenteredLayout>
        </SignupContext.Provider>
    )
}


const EmailStep = ({ signInWithGoogle, type }) => {
    const [email, setEmail] = useState('');
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
                    <Button disabled={type === 'business' && !['dealer', 'mechanic'].includes(user_type)} w={'100%'} variant="outline" borderColor="lightgrey" rounded="lg" onClick={signInWithGoogle} leftIcon={<FaGoogle />} colorScheme="white" color={'secondary'} bg={'white'}> Sign up with Google </Button>
                    <Button disabled={type === 'business' && !['dealer', 'mechanic'].includes(user_type)} w={'100%'} variant="outline" borderColor="lightgrey" rounded="lg" onClick={signInWithGoogle} leftIcon={<FaFacebook />} colorScheme="white" color={'secondary'} bg={'white'}>Sign up with Facebook </Button>
                </Stack>

                <Divider my={3} />
                <RLink to={`/signup/${type !== 'business' ? 'business' : ''}`}>
                    <Button py={5} rightIcon={<FaArrowRight />} colorScheme="blue" variant="outline" borderWidth={3} borderColor="primary" w={"100%"} rounded="lg"> Create {type === 'business' ? 'Personal' : 'Business'} Account </Button>
                </RLink>
            </form>
        </Box>
    )
}


const SignupStep = ({ skipEmailConfirmation }) => {
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
            id_type,
            user_type
        }

        try{
            addToPayload({ ...newPayload });

            const res = await axios.post('/accounts/register/', JSON.stringify(newPayload));
            const data = objectifyJSON(res.data)

            if (res.status === 201){
                localStorage.setItem('motaa-auth-user', jsonifyObject(data));
                notify({
                    title: 'Success',
                    body: "Successfully created your account"
                });

                if (skipEmailConfirmation){
                    // gotoStep(3); // no phone number verification
                    return redirect('/');
                }else{
                    return nextStep();
                }
            }else{
                console.log("Signup Error", data)
                notify({
                    title: 'Error!',
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

                <FormControl width={{ base: '100%', md: '50%' }} my={2}>
                    <FormLabel> Means of Identification </FormLabel>
                    <Input as={Select}
                        onChange={e => setIdType(e.target.value)}
                        value={id_type}
                        defaultValue={'nin'}
                    >
                        <option value={'nin'}> NIN Number </option>
                        <option value={'voters-card'}> Voter's Card </option>
                        <option value={'drivers-license'}> Driver's License </option>
                        <option value={'passport'}> Passport </option>
                    </Input>
                </FormControl>
            </Flex>

            {
                user_type === "dealer" || user_type === "mechanic" && 
                <Flex justifyContent={'space-between'} columnGap={3} flexWrap={{base: 'wrap', md: 'nowrap'}}>
                    <FormControl width={{ base: '100%', md: '50%' }} my={2}>
                        <FormLabel> CAC Registration number </FormLabel>
                        <Input
                            onInput={e => setCACNumber(e.target.value)}
                            value={cac_number} type="tel"
                            placeholder="RC 12 4128 234"
                        />
                    </FormControl>
                </Flex>
            }

            <FormControl mt={3}>
                <Button type="submit" w={'100%'} colorScheme="blue" bg={'primary'}> Continue </Button>
            </FormControl>
        </form>
    )
}


const ConfirmationStep = ({ verification }) => {
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
                'User-Agent': `${document.location.hostname}`,
                'Authorization': `Token ${token}`
            }
        })
    }
    
    async function verifyCode(){
        const auth = objectifyJSON(localStorage.getItem('motaa-auth-user'));
        const token = auth.token
        console.log("OTP:", otp);
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
        timer.current.innerHTML = `Request new code in 60s`;
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
