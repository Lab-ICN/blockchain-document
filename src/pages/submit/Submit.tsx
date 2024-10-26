import { useState } from 'react'
import Swal from 'sweetalert2';

import { connectAccount, getDefaultAddress, isAuthorizedToMint, issueDocument } from "../../components/account/Web3";
import { embedPDFVerificationBlockchain } from '../../components/document/pdf';

function Submit() {
  const [account, setAccount] = useState<string | undefined>(undefined);

  // Form Data
  const [file, setFile] = useState<File | undefined>(undefined);
  // const [isPublic, setIsPublic] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>(new FormData());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = formData;
    newFormData.set(e.target.name, e.target.value);
    setFormData(newFormData);
  }

  // const handlePublicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setIsPublic(e.target.checked);
  // }

  const handleSubmitClick = async () => {
    if (!await getDefaultAddress()) {
      Swal.fire({
        title: "Wallet not connected",
        text: "Please connect your Web3 wallet first.",
        icon: "error"
      });
      return;
    }
    if (file) {
      if (await isAuthorizedToMint()) {
        const hash = await issueDocument(formData, file);
        if (hash) {
          Swal.fire({
            title: "Document Issued",
            text: `Transaction Hash: ${hash}`,
            icon: "success",
            footer: `<a target="_blank" href="${import.meta.env.VITE_BLOCK_EXPLORER}/tx/${hash}">View Transaction Details</a>`
          });
          handlePDFSign(`${import.meta.env.VITE_BLOCK_EXPLORER}/tx/${hash}`)
        }
      } else {
        Swal.fire({
          title: "Access Denied",
          text: "You are not allowed to mint documents",
          icon: "error"
        })
      }
    }
  }

  const handlePDFSign = async (qr_payload_str: string) => {
    if (file) {
      const issuer: string = formData.get('issuer')!.toString();
      const signedFile = await embedPDFVerificationBlockchain(file, issuer, qr_payload_str);
      
      // trigger download from signedFile on react js
      const url = URL.createObjectURL(signedFile);
      console.log('downloading signed pdf...')
      const link = document.createElement('a');
      link.href = url;
      link.download = 'signed_doc.pdf';
      document.body.appendChild(link);
      link.click();
    }
  }

  getDefaultAddress().then((acc) => setAccount(acc));

  return (
    <div className="submit h-full w-full flex flex-col items-center justify-center">
      <header className='w-full my-2 font-bold'>
        <h1>Document Certificate Upload</h1>
      </header>

      <div className="account my-4">
        <p>{
          (account)
            ?
            `Your address: ${account}`
            :
            `Wallet not connected`
        }</p>
        <button className='mt-2' onClick={
          async () => {
            if (!account) {
              await connectAccount();
            }
            setAccount(await getDefaultAddress());
          }
        }>Connect Web3 Account</button>
      </div>

      <div className="container">
        <div className='form'>
          <div className='metadata mb-6'>
            <input type="text" name='documentTitle' placeholder="Document Title" className="w-full mt-2 rounded-lg p-2" onChange={ handleFormChange } />
            <input type="text" name='issuer' placeholder="Issuer" className="w-full mt-2 rounded-lg p-2" onChange={ handleFormChange } />
            <input type="text" name='issuedTo' placeholder="Issued To (ETH Address)" className="w-full mt-2 rounded-lg p-2" onChange={ handleFormChange } />

            {/* <label className="inline-flex items-center cursor-pointer mt-2">
              <span className="me-3 text-sm font-medium text-gray-900 dark:text-gray-300">Public</span>
              <input type="checkbox"  value="" className="sr-only peer" onChange={ handlePublicChange } checked={isPublic}/>
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label> */}

          </div>
          <div id='upload-box'>
            <p className='mb-2 text-start'>Upload Document</p>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50  dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                  </svg>
                  {
                    !file
                      ?
                      <div>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className='font-semibold'>Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF</p>
                      </div>
                      :
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{file.name}</p>
                  }
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={ handleFileChange } />
              </label>
            </div>
          </div>
        </div>
        <button className='font-bold mt-3' onClick={ handleSubmitClick }>Submit Document</button>
        {/* <button className='font-bold mt-3' onClick={ handlePDFSign }>Test PDF Sign</button> */}
      </div>
    </div>
  )
}

export default Submit;