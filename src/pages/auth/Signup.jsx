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
    PinInput,
    PinInputField,
    Select,
    SelectField,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useContext, useRef, useState } from "react";
import { GlobalStore } from "../../App";
import {motion} from 'framer-motion';
import { CenteredLayout, OTPField, TwoFactorPinForm } from "../../components";
import { redirect, useNavigate, useParams } from "react-router-dom";
import { RiCircleFill, RiCircleLine, RiMailCloseFill, RiMailFill, RiMessage2Line, RiMessage3Line, RiMessageLine } from "react-icons/ri";
import { FcSms, FcVoicemail } from "react-icons/fc";
import { RxChatBubble, RxEnvelopeOpen } from "react-icons/rx";
import { jsonifyObject, objectifyJSON } from "../../utils";

export const SignupView = ({ ...props }) => {
    const params = new URLSearchParams(document.location.search);
    let user_type = params.get('user_type');
    // ('user_type');
    console.log("User:", user_type)
    const {onAuthenticated, axios, notify, onError} = useContext(GlobalStore)
    const [step, setStepValue] = useState(0);
    const [payload, setPayload] = useState({});
    const [verification, setVerification] = useState('email')

    const steps = [
        { title: 'Create your account',
            description: 'Start your 30-day free trial', 
            component: <EmailStep nextStep={nextStep} onSubmit={onSubmit} />
        },
        { title: 'Create your account',
            description: 'Start your 30-day free trial', 
            component: <SignupStep nextStep={nextStep} onSubmit={onSubmit} payload={payload} user_type={user_type} />
        },
        { title: 'Confirm your email',
            description: 'Verify your email to get notifications and updates from Motaa.',
            component: <ConfirmationStep verification={verification} nextStep={() => setVerification('email')} onSubmit={onSubmit} payload={payload} />
        },
        { title: 'Confirm your phone number',
            description: 'Verify your email to get notifications and updates from Motaa.',
            component: <ConfirmationStep verification={verification} nextStep={() => redirect(`/home?welcome=${payload.first_name}`)} onSubmit={onSubmit} payload={payload} />
        },
    ]

    function nextStep(){
        setStepValue((step+1))
    }
    
    function onSubmit(data){
        setPayload({
            ...payload,
            ...data
        })
    }

    async function createAccount(formData){
        onSubmit(formData);

        try{
            const res = await axios.post('/accounts/register/', {
                data: {
                    ...payload,
                    user_type: user_type || 'customer'
                }
            })

            const data = JSON.parse(res.data)
            console.log("Got Data:", data)

        }catch(error){

        }
    }

    return(
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
    )
}


const EmailStep = ({ nextStep, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const {axios, notify, onError} = useContext(GlobalStore)

    async function handleSubmit(e){
        e.preventDefault();
        try{
            const res = await axios.get(`/accounts/register/?email=${email}`);
            const data = objectifyJSON(res.data)
            if (res.status === 200){
                onSubmit({
                    email,
                    password
                });
                nextStep();
            }else{
                notify({
                    title: 'Error!',
                    body: data.message,
                    color: 'red',
                })
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
                        <Button type="submit" w={'100%'} colorScheme="blue" bg={'primary'}> Get Started  </Button>
                    </FormControl>
                </Stack>
            
                <HStack my={5}>
                    <Divider />
                    <Heading size={'sm'} color={'grey'}> OR </Heading>
                    <Divider />
                </HStack>

                <Stack flex={1} columnGap={4}>
                    <Button w={'100%'} colorScheme="white" shadow="dark-lg" color={'secondary'} bg={'white'}> Log in with Google </Button>
                    <Button w={'100%'} colorScheme="blue" bg={'primary'}> Log in with Facebook </Button>
                </Stack>

            </form>
        </Box>
    )
}


const SignupStep = ({ nextStep, onSubmit, canProceed, payload, user_type }) => {
    const {axios, notify, onAuthenticated} = useContext(GlobalStore);
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [phone_number, setPhoneNumber] = useState('');
    const [cac_number, setCACNumber] = useState('');
    const [id_type, setIdType] = useState('nin');

    async function handleSubmit(e){ 
        e.preventDefault();

        const newPayload = {
            ...payload,
            cac_number,
            first_name,
            last_name,
            phone_number,
            id_type,
            user_type: user_type || 'customer'
        }

        try{
            onSubmit({ ...newPayload });

            const res = await axios.post('/accounts/register/', JSON.stringify(newPayload));
            const data = objectifyJSON(res.data)

            if (res.status === 201){
                localStorage.setItem('motaa-auth-user', jsonifyObject(data));
                notify({
                    title: 'Success',
                    body: "Successfully created your account"
                });

                nextStep();
            }else{
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
                user_type === "dealer" && 
                <Flex justifyContent={'space-between'} columnGap={3} flexWrap={{base: 'wrap', md: 'nowrap'}}>
                    <FormControl width={{ base: '100%', md: '50%' }} my={2}>
                        <FormLabel> CAC Registration number </FormLabel>
                        <Input
                            onInput={e => setCACNumber(e.target.value)}
                            value={cac_number} type="tel"
                            placeholder="RC 12 4128 234"
                        />
                    </FormControl>

                    {/* <FormControl width={{ base: '100%', md: '50%' }} my={2}>
                        <FormLabel> Means of Identification </FormLabel>
                        <Input as={SelectField}
                            onChange={e => setIdType(e.target.value)}
                            value={id_type}
                            defaultValue={'nin'}
                        >
                            <option value={'nin'}> NIN Number </option>
                            <option value={'voters-card'}> Voter's Card </option>
                            <option value={'drivers-license'}> Driver's License </option>
                            <option value={'passport'}> Passport </option>
                        </Input>
                    </FormControl> */}
                </Flex>
            }

            <FormControl mt={3}>
                <Button type="submit" w={'100%'} colorScheme="blue" bg={'primary'}> Continue </Button>
            </FormControl>
        </form>
    )
}


const ConfirmationStep = ({ nextStep, payload, verification }) => {
    const {axios, notify, onAuthenticated} = useContext(GlobalStore);
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
                redirect('/buy');
            }
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
