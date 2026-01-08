'use client'
import React from 'react'
import { cn } from '@/lib/utils'
import { IconNames, IconProps, TIconComponent } from './type'

import SixDotsOutlined from './assets/Icon_6 Dots-Outlined.svg'
import SixDotsFilled from './assets/Icon_6 Dots-Filled.svg'
import ArrowDownOutlined from './assets/Icon_Arrow Down-Outlined.svg'
import ArrowDownFilled from './assets/Icon_Arrow Down-Filled.svg'
import ArrowLeftOutlined from './assets/Icon_Arrow Left-Outlined.svg'
import ArrowLeftFilled from './assets/Icon_Arrow Left-Filled.svg'
import ArrowRightOutlined from './assets/Icon_Arrow Right-Outlined.svg'
import ArrowRightFilled from './assets/Icon_Arrow Right-Filled.svg'
import ArrowUpOutlined from './assets/Icon_Arrow Up-Outlined.svg'
import ArrowUpFilled from './assets/Icon_Arrow Up-Filled.svg'
import ArrowUpDownOutlined from './assets/Icon_Arrow Up Down-Outlined.svg'
import ArrowUpDownFilled from './assets/Icon_Arrow Up Down-Filled.svg'
import Attention from './assets/Icon_Attention.svg'
import BankRoundedOutlined from './assets/Icon_Bank-Rounded-Outlined.svg'
import BellOutlined from './assets/Icon_Bell-Outlined.svg'
import BellFilled from './assets/Icon_Bell-Filled.svg'
import BoxOutlined1 from './assets/Icon_Box-Outlined-1.svg'
import BoxFilled1 from './assets/Icon_Box-Filled-1.svg'
import BoxOutlined from './assets/Icon_Box-Outlined.svg'
import BoxFilled from './assets/Icon_Box-Filled.svg'
import BuildingOutlined from './assets/Icon_Building-Outlined.svg'
import BuildingFilled from './assets/Icon_Building-Filled.svg'
import CalendarOutlined from './assets/Icon_Calendar-Outlined.svg'
import CalendarFilled from './assets/Icon_Calendar-Filled.svg'
import CameraOutlined from './assets/Icon_Camera-Outlined.svg'
import CameraFilled from './assets/Icon_Camera-Filled.svg'
import CartOutlined from './assets/Icon_Cart-Outlined.svg'
import CartFilled from './assets/Icon_Cart-Filled.svg'
import CheckCircleOutlined from './assets/Icon_Check Circle-Outlined.svg'
import CheckCircleFilled from './assets/Icon_Check Circle-Filled.svg'
import CheckOutlined from './assets/Icon_Check-Outlined.svg'
import CheckFilled from './assets/Icon_Check-Filled.svg'
import ChevronDownOutlined from './assets/Icon_Chevron Down-Outlined.svg'
import ChevronDownFilled from './assets/Icon_Chevron Down-Filled.svg'
import ChevronDownBigOutlined from './assets/Icon_Chevron Down Big-Outlined.svg'
import ChevronDownBigFilled from './assets/Icon_Chevron Down Big-Filled.svg'
import ChevronLeftOutlined from './assets/Icon_Chevron Left-Outlined.svg'
import ChevronLeftFilled from './assets/Icon_Chevron Left-Filled.svg'
import ChevronLeftBigOutlined from './assets/Icon_Chevron Left Big-Outlined.svg'
import ChevronLeftBigFilled from './assets/Icon_Chevron Left Big-Filled.svg'
import ChevronRightOutlined from './assets/Icon_Chevron Right-Outlined.svg'
import ChevronRightFilled from './assets/Icon_Chevron Right-Filled.svg'
import ChevronRightBigOutlined from './assets/Icon_Chevron Right Big-Outlined.svg'
import ChevronRightBigFilled from './assets/Icon_Chevron Right Big-Filled.svg'
import ChevronUpOutlined from './assets/Icon_Chevron Up-Outlined.svg'
import ChevronUpFilled from './assets/Icon_Chevron Up-Filled.svg'
import ChevronUpBigOutlined from './assets/Icon_Chevron Up Big-Outlined.svg'
import ChevronUpBigFilled from './assets/Icon_Chevron Up Big-Filled.svg'
import ClockOutlined from './assets/Icon_Clock-Outlined.svg'
import ClockFilled from './assets/Icon_Clock-Filled.svg'
import CloseOutlined from './assets/Icon_Close-Outlined.svg'
import CloseFilled from './assets/Icon_Close-Filled.svg'
import CloseBigOutlined from './assets/Icon_Close Big-Outlined.svg'
import CloseBigRoundedOutlined from './assets/Icon_Close-Big-Rounded-Outlined.svg'
import CloseBigFilled from './assets/Icon_Close Big-Filled.svg'
import CoinOutlined from './assets/Icon_Coin-Outlined.svg'
import CoinFilled from './assets/Icon_Coin-Filled.svg'
import ColumnOutlined from './assets/Icon_Column-Outlined.svg'
import ColumnFilled from './assets/Icon_Column-Filled.svg'
import CopyOutline from './assets/Icon_Copy-Outline.svg'
import CopyFilled from './assets/Icon_Copy-Filled.svg'
import CreditRoundedOutlined from './assets/Icon_Credit-Rounded-Outlined.svg'
import DebitRoundedOutlined from './assets/Icon_Debit-Rounded-Outlined.svg'
import DocumentOutlined from './assets/Icon_Document-Outlined.svg'
import DocumentFilled from './assets/Icon_Document-Filled.svg'
import DocumentAddOutlined from './assets/Icon_Document-Add-Outlined.svg'
import DocumentUpdateOutlined from './assets/Icon_Document-Update-Outlined.svg'
import DocumentUserOutlined from './assets/Icon_DocumentUser-Outlined.svg'
import DownloadOutlined from './assets/Icon_Download-Outlined.svg'
import DownloadFilled from './assets/Icon_Download-Filled.svg'
import EditOutlined from './assets/Icon_Edit-Outlined.svg'
import EditFilled from './assets/Icon_Edit-Filled.svg'
import EyeOutlined from './assets/Icon_Eye-Outlined.svg'
import EyeFilled from './assets/Icon_Eye-Filled.svg'
import EyeCrossedOutlined from './assets/Icon_Eye Crossed-Outlined.svg'
import EyeCrossedFilled from './assets/Icon_Eye Crossed-Filled.svg'
import FullScreenOutlined from './assets/Icon_Full Screen-Outlined.svg'
import FullScreenFilled from './assets/Icon_Full Screen-FIlled.svg'
import GiftOutlined from './assets/Icon_Gift-Outlined.svg'
import GiftFilled from './assets/Icon_Gift-FIlled.svg'
import GridOutlined from './assets/Icon_Grid-Outlined.svg'
import GridFilled from './assets/Icon_Grid-Filled.svg'
import GovernmentOutlined from './assets/Icon_Govenment-Outlined.svg'
import HelpCircleOutlined from './assets/Icon_Help Circle-Outlined.svg'
import HelpCircleFilled from './assets/Icon_Help Circle-Filled.svg'
import HomeOutlined from './assets/Icon_Home-Outlined.svg'
import HomeFilled from './assets/Icon_Home-FIlled.svg'
import HourglassOutlined from './assets/Icon_Hourglass-Rounded-Outlined.svg'
import IDCardOutlined from './assets/Icon_ID Card-Outlined.svg'
import IDCardFilled from './assets/Icon_ID Card-Filled.svg'
import IDCardOutlined1 from './assets/Icon_ID Card-Outlined-1.svg'
import IDCardFilled1 from './assets/Icon_ID Card-Filled-1.svg'
import ImageOutlined from './assets/Icon_Image-Outlined.svg'
import ImageFilled from './assets/Icon_Image-Filled.svg'
import InfoCircleOutlined from './assets/Icon_Info Circle-Outlined.svg'
import InfoCircleFilled from './assets/Icon_Info Circle-Filled.svg'
import InvoiceOutlined from './assets/Icon_Invoice-Outlined.svg'
import InvoiceFilled from './assets/Icon_Invoice-Filled.svg'
import InvoiceInOutlined from './assets/Icon_Invoice In-Outlined.svg'
import InvoiceInFilled from './assets/Icon_Invoice In-Filled.svg'
import LinkOutline from './assets/Icon_Link-Outline.svg'
import LogOutOutlined from './assets/Icon_Log Out-Outlined.svg'
import LogOutFilled from './assets/Icon_Log Out-Filled.svg'
import MailOutlined from './assets/Icon_Mail-Outlined.svg'
import MailFilled from './assets/Icon_Mail-Filled.svg'
import MenuOutlined from './assets/Icon_Menu-Outlined.svg'
import MenuFilled from './assets/Icon_Menu-Filled.svg'
import MinimizeOutlined from './assets/Icon_Minimize-Outlined.svg'
import MinimizeFilled from './assets/Icon_Minimize-FIlled.svg'
import PhoneOutline from './assets/Icon_Phoned-Outline.svg'
import PhoneFilled from './assets/Icon_Phone-Filled.svg'
import PlusOutlined from './assets/Icon_Plus-Outlined.svg'
import PlusFilled from './assets/Icon_Plus-Filled.svg'
import PlusCircleOutlined from './assets/Icon_Plus Circle-Outlined.svg'
import PlusCircleFilled from './assets/Icon_Plus Circle-Filled.svg'
import PlusCloseCircleOutlined from './assets/Icon_Plus Close Circle-Outlined.svg'
import PlusCloseCircleFilled from './assets/Icon_Plus Close Circle-Filled.svg'
import PrintOutlined from './assets/Icon_Print-Outlined.svg'
import PrintFilled from './assets/Icon_Print-Filled.svg'
import SearchOutlined from './assets/Icon_Search-Outlined.svg'
import SearchFilled from './assets/Icon_Search-Filled.svg'
import SearchCrossedOutlined from './assets/Icon_Search Crossed -Outlined.svg'
import SearchCrossedFilled from './assets/Icon_Search Crossed -Filled.svg'
import SearchMinusOutlined from './assets/Icon_Search Minus Rounded-Outlined.svg'
import SearchPlusOutlined from './assets/Icon_Search Plus Rounded-Outlined.svg'
import SettingsOutlined from './assets/Icon_Settings-Outlined.svg'
import SettingsFilled from './assets/Icon_Settings-Filled.svg'
import ShakeHandOutlined from './assets/Icon_Shake Hand-Outlined.svg'
import ShakeHandFilled from './assets/Icon_Shake Hand-Filled.svg'
import ShareOutlined from './assets/Icon_Share-Outlined.svg'
import ShareFilled from './assets/Icon_Share-Filled.svg'
import SidebarOutlined from './assets/Icon_Sidebar-Outlined.svg'
import SidebarFilled from './assets/Icon_Sidebar-Filled.svg'
import StarOutlined from './assets/Icon_Star-Outlined.svg'
import StoreOutlined from './assets/Icon_Store-Outlined.svg'
import StarFilled from './assets/Icon_Star-Filled.svg'
import SuitcaseOutlined from './assets/Icon_Suitcase-Outlined.svg'
import SuitcaseFilled from './assets/Icon_Suitcase-Filled.svg'
import TableOutlined from './assets/Icon_Table-Outlined.svg'
import TableFilled from './assets/Icon_Table-Filled.svg'
import TagOutlined from './assets/Icon_Tag-Outlined.svg'
import ThumbDownOutlined from './assets/Icon_Thumb Down-Outlined.svg'
import ThumbDownFilled from './assets/Icon_Thumb Down-Filled.svg'
import ThumbUpOutlined from './assets/Icon_Thumb Up-Outlined.svg'
import ThumbUpFilled from './assets/Icon_Thumb Up-Filled.svg'
import TrashOutlined from './assets/Icon_Trash-Outlined.svg'
import TrashFilled from './assets/Icon_Trash-FIlled.svg'
import TransactionSettlement from './assets/Icon_Transaction-Settlement.svg'
import TriangleDownOutlined from './assets/Icon_Triangle Down-Outlined.svg'
import TriangleDownFilled from './assets/Icon_Triangle Down-Filled.svg'
import TriangleLeftOutlined from './assets/Icon_Triangle Left-Outlined.svg'
import TriangleLeftFilled from './assets/Icon_Triangle Left-Filled.svg'
import TriangleRightOutlined from './assets/Icon_Triangle Right-Outlined.svg'
import TriangleRightFilled from './assets/Icon_Triangle Right-Filled.svg'
import TriangleUpOutlined from './assets/Icon_Triangle Up-Outlined.svg'
import TriangleUpFilled from './assets/Icon_Triangle Up-Filled.svg'
import TunedOutline from './assets/Icon_Tuned-Outline.svg'
import TunedRoundedOutlined from './assets/Icon_Tuned-Rounded-Outline.svg'
import TuneFilled from './assets/Icon_Tune-Filled.svg'
import TransactionOutlined from './assets/Icon_Transaction-Outlined.svg'
import TransactionFilled from './assets/Icon_Transaction-Filled.svg'
import UpDownSortOutlined from './assets/Icon_Up Down Sort-Outlined.svg'
import UpDownSortFilled from './assets/Icon_Up Down Sort-Filled.svg'
import UploadOutlined from './assets/Icon_Upload-Outlined.svg'
import UploadRoundedOutlined from './assets/Icon_Upload-Rounded-Outlined.svg'
import UploadFilled from './assets/Icon_Upload-Filled.svg'
import UserOutlined from './assets/Icon_User-Outlined.svg'
import UserFilled from './assets/Icon_User-Filled.svg'
import UserBoxOutlined from './assets/Icon_User Box-Outlined.svg'
import UserBoxFilled from './assets/Icon_User Box-Filled.svg'
import UserCircleOutlined from './assets/Icon_UserCircle-Outlined.svg'
import UserMoneyOutlined from './assets/Icon_User Money-Outlined.svg'
import UserMoneyFilled from './assets/Icon_User Money-Filled.svg'
import UserSettingsOutlined from './assets/Icon_UserSettings-Outlined.svg'
import VerifiedOutlined from './assets/Icon_Verified-Outlined.svg'
import VerifiedFilled from './assets/Icon_Verified-Filled.svg'
import VoucherOutlined from './assets/Icon_Voucher-Outlined.svg'
import VoucherFilled from './assets/Icon_Voucher-Filled.svg'
import WarningCircleOutlined from './assets/Icon_Warning Circle-Outlined.svg'
import WarningCircleFilled from './assets/Icon_Warning Circle-Filled.svg'
import LoaderCircle from './assets/loader-circle.svg'
import RedirectOutlined from './assets/Icon_Redirect-Outlined.svg'
import SendOutlined from './assets/Icon_Send-Outlined.svg'
import WithdrawPending from './assets/Icon_Withdraw-Pending.svg'
import WithdrawFailed from './assets/Icon_Withdraw-Failed.svg'
import CardOutline from './assets/Icon_Card-Outlined.svg'
import LoaderWhite from './assets/loader-animated-white.svg'
import RefreshRoundedOutlined from './assets/Icon_Refresh-Rounded-Outlined.svg'
import CardExchangeOutlined from './assets/Icon_CardExchange-Outlined.svg'
import PaymentSucceedOutlined from './assets/Icon_Payment-Succeed-Outlined.svg'
import PaymentFailedOutlined from './assets/Icon_Payment-Failed-Outlined.svg'
import CloseCircleRoundedFilled from './assets/Icon_Plus-Close-Circle-Rounded-Filled.svg'
import LockOutlined from './assets/Icon_Lock-Rounded-Outlined.svg'
import CopyRoundedOutlined from './assets/Icon_Copy-Rounded-Outline.svg'
import DocumentRevisionRoundedOutlined from './assets/Icon_Document-Revision-Rounded-Outlined.svg'
import SkipRoundedOutlined from './assets/Icon_Skip-Rounded-Outlined.svg'
import ReviewOutlined from './assets/Icon_Review Rounded-Outlined.svg'
import IconHistoryRoundedOutlined from './assets/Icon_History_Rounded-Outlined.svg'
import IconImageRoundedOutlined from './assets/Icon_Image-Rounded-Outlined.svg'
import LawRoundedOulined from './assets/Icon_Law-Rounded-Outlined.svg'
import SaveRoundedOutlined from './assets/Icon_Save Rounded-Outlined.svg'
import CheckDocumentOutlined from './assets/Icon_CheckDocumentRounded-Outlined.svg'
import IconUserSettingRoundedOutlined from './assets/Icon_User Settings Rounded-Outlined.svg'
import IconCheckDocumentRoundedOutlined from './assets/Icon_Check Document Rounded-Outlined.svg'
import IconMoneyBagRoundedOutlined from './assets/Icon_Money-Bag-Rounded-Outlined.svg'
import IconFileDocumentPlus from './assets/Icon_File-Document-Plus.svg'
import IconSwitchOutlined from './assets/Icon_Switch-Outlined.svg'
import IconFileDocumentSearch from './assets/Icon_File-Document-Search.svg'

export const iconPaths: Record<IconNames, TIconComponent> = {
  '6DotsOutlined': SixDotsOutlined,
  '6DotsFilled': SixDotsFilled,
  ArrowDownOutlined,
  ArrowDownFilled,
  ArrowLeftOutlined,
  ArrowLeftFilled,
  ArrowRightOutlined,
  ArrowRightFilled,
  ArrowUpOutlined,
  ArrowUpFilled,
  ArrowUpDownOutlined,
  ArrowUpDownFilled,
  Attention,
  BankRoundedOutlined,
  BellOutlined,
  BellFilled,
  BoxOutlined1,
  BoxFilled1,
  BoxOutlined,
  BoxFilled,
  BuildingOutlined,
  BuildingFilled,
  CalendarOutlined,
  CalendarFilled,
  CameraOutlined,
  CameraFilled,
  CartOutlined,
  CartFilled,
  CheckCircleOutlined,
  CheckCircleFilled,
  CheckDocumentOutlined,
  CheckOutlined,
  CheckFilled,
  ChevronDownOutlined,
  ChevronDownFilled,
  ChevronDownBigOutlined,
  ChevronDownBigFilled,
  ChevronLeftOutlined,
  ChevronLeftFilled,
  ChevronLeftBigOutlined,
  ChevronLeftBigFilled,
  ChevronRightOutlined,
  ChevronRightFilled,
  ChevronRightBigOutlined,
  ChevronRightBigFilled,
  ChevronUpOutlined,
  ChevronUpFilled,
  ChevronUpBigOutlined,
  ChevronUpBigFilled,
  ClockOutlined,
  ClockFilled,
  CloseOutlined,
  CloseFilled,
  CloseBigOutlined,
  CloseBigRoundedOutlined,
  CloseBigFilled,
  CoinOutlined,
  CoinFilled,
  ColumnOutlined,
  ColumnFilled,
  CopyOutline,
  CopyFilled,
  CopyRoundedOutlined,
  CreditRoundedOutlined,
  DebitRoundedOutlined,
  DocumentAddOutlined,
  DocumentOutlined,
  DocumentFilled,
  DocumentRevisionRoundedOutlined,
  DocumentUserOutlined,
  DocumentUpdateOutlined,
  DownloadOutlined,
  DownloadFilled,
  EditOutlined,
  EditFilled,
  EyeOutlined,
  EyeFilled,
  EyeCrossedOutlined,
  EyeCrossedFilled,
  FullScreenOutlined,
  FullScreenFilled,
  GiftOutlined,
  GiftFilled,
  GridOutlined,
  GridFilled,
  GovernmentOutlined,
  HelpCircleOutlined,
  HelpCircleFilled,
  HomeOutlined,
  HomeFilled,
  HourglassOutlined,
  IDCardOutlined,
  IDCardFilled,
  IDCardOutlined1,
  IDCardFilled1,
  ImageOutlined,
  ImageFilled,
  InfoCircleOutlined,
  InfoCircleFilled,
  InvoiceOutlined,
  InvoiceFilled,
  InvoiceInOutlined,
  InvoiceInFilled,
  LinkOutline,
  LogOutOutlined,
  LogOutFilled,
  MailOutlined,
  MailFilled,
  MenuOutlined,
  MenuFilled,
  MinimizeOutlined,
  MinimizeFilled,
  PhoneOutline,
  PhoneFilled,
  PlusOutlined,
  PlusFilled,
  PlusCircleOutlined,
  PlusCircleFilled,
  PlusCloseCircleOutlined,
  PlusCloseCircleFilled,
  PrintOutlined,
  PrintFilled,
  RedirectOutlined,
  RefreshRoundedOutlined,
  ReviewOutlined,
  SaveRoundedOutlined,
  SearchOutlined,
  SearchFilled,
  SearchCrossedOutlined,
  SearchCrossedFilled,
  SendOutlined,
  SettingsOutlined,
  SettingsFilled,
  ShakeHandOutlined,
  ShakeHandFilled,
  ShareOutlined,
  ShareFilled,
  SidebarOutlined,
  SidebarFilled,
  StarOutlined,
  StarFilled,
  StoreOutlined,
  SuitcaseOutlined,
  SuitcaseFilled,
  TableOutlined,
  TableFilled,
  TagOutlined,
  ThumbDownOutlined,
  ThumbDownFilled,
  ThumbUpOutlined,
  ThumbUpFilled,
  TransactionSettlement,
  TrashOutlined,
  TrashFilled,
  TriangleDownOutlined,
  TriangleDownFilled,
  TriangleLeftOutlined,
  TriangleLeftFilled,
  TriangleRightOutlined,
  TriangleRightFilled,
  TriangleUpOutlined,
  TriangleUpFilled,
  TunedOutline,
  TunedRoundedOutlined,
  TuneFilled,
  TransactionOutlined,
  TransactionFilled,
  UpDownSortOutlined,
  UpDownSortFilled,
  UploadOutlined,
  UploadRoundedOutlined,
  UploadFilled,
  UserOutlined,
  UserFilled,
  UserBoxOutlined,
  UserBoxFilled,
  UserCircleOutlined,
  UserMoneyOutlined,
  UserMoneyFilled,
  UserSettingsOutlined,
  VerifiedOutlined,
  VerifiedFilled,
  VoucherOutlined,
  VoucherFilled,
  WarningCircleOutlined,
  WarningCircleFilled,
  WithdrawPending,
  WithdrawFailed,
  LoaderCircle,
  CardOutline,
  SearchMinusOutlined,
  SearchPlusOutlined,
  LoaderWhite,
  CardExchangeOutlined,
  PaymentSucceedOutlined,
  PaymentFailedOutlined,
  LockOutlined,
  SkipRoundedOutlined,
  CloseCircleRoundedFilled,
  IconHistoryRoundedOutlined,
  IconImageRoundedOutlined,
  LawRoundedOulined,
  IconUserSettingRoundedOutlined,
  IconCheckDocumentRoundedOutlined,
  IconMoneyBagRoundedOutlined,
  IconFileDocumentPlus,
  IconSwitchOutlined,
  IconFileDocumentSearch,
}

const Icon: React.FC<IconProps> = ({ name, className, size = 24 }) => {
  const IconComponent = iconPaths[name]
  if (IconComponent) {
    return (
      <div className={cn(className)}>
        <IconComponent width={size} height={size} />
      </div>
    )
  }
  return null
}

export default Icon
